// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title POHRewards — Proof of Planet Token Distribution
 * @notice Distributes POH tokens from the Community Rewards pool (50% of supply)
 *         using weekly merkle trees with 24hr timelock and reputation-based vesting.
 *
 * Flow:
 *   1. Backend computes weekly rewards → builds merkle tree
 *   2. Owner stages root via setMerkleRoot() — 24hr timelock begins
 *   3. After 24hrs, owner calls activateMerkleRoot() to finalize
 *   4. Users call claim() with merkle proof
 *   5. Immediate portion → savings wallet (or msg.sender)
 *   6. Vesting portion → locked in contract until unlock time
 *   7. After vesting period, user calls releaseVested() to receive tokens
 *
 * Vesting tiers (calculated off-chain by backend):
 *   - New miners (<6mo reputation): 25% immediate / 75% vests 180 days
 *   - Veterans (6mo+ reputation):   75% immediate / 25% vests 30 days
 *
 * Funded by transferring Community Rewards tokens to this contract.
 */
contract POHRewards is Ownable {
    using SafeERC20 for IERC20;

    // ── Constants ────────────────────────────────────────────────────────
    uint256 public constant TIMELOCK_DURATION = 24 hours;

    // ── State ────────────────────────────────────────────────────────────
    IERC20 public immutable token;

    /// @notice Current epoch number (incremented each time a merkle root is activated)
    uint256 public currentEpoch;

    /// @notice Merkle root for each epoch
    mapping(uint256 => bytes32) public merkleRoots;

    /// @notice Whether an address has claimed for a given epoch
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    /// @notice Savings wallet (cold storage / Ledger) for each user
    mapping(address => address) public savingsWallet;

    /// @notice Total tokens distributed (immediate + released vesting)
    uint256 public totalDistributed;

    // ── Timelock ─────────────────────────────────────────────────────────
    /// @notice Pending merkle root awaiting timelock expiry
    bytes32 public pendingRoot;

    /// @notice Timestamp when the pending root was staged
    uint256 public pendingRootTimestamp;

    // ── Vesting ──────────────────────────────────────────────────────────
    struct VestingInfo {
        uint256 amount;
        uint256 unlocksAt;
        bool released;
    }

    /// @notice Vesting entries per user per epoch
    mapping(address => mapping(uint256 => VestingInfo)) public vesting;

    /// @notice Total tokens currently locked in vesting across all users
    uint256 public totalVesting;

    // ── Events ───────────────────────────────────────────────────────────
    event MerkleRootStaged(bytes32 root, uint256 activatesAt);
    event MerkleRootActivated(uint256 indexed epoch, bytes32 root);
    event MerkleRootCancelled(bytes32 root);
    event RewardsClaimed(
        uint256 indexed epoch,
        address indexed claimant,
        address indexed recipient,
        uint256 immediateAmount,
        uint256 vestingAmount,
        uint256 vestingUnlocksAt
    );
    event VestingReleased(
        uint256 indexed epoch,
        address indexed user,
        address indexed recipient,
        uint256 amount
    );
    event SavingsWalletSet(address indexed user, address indexed wallet);

    // ── Constructor ──────────────────────────────────────────────────────
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Rewards: token is zero");
        token = IERC20(_token);
    }

    // ── User: Set savings wallet ─────────────────────────────────────────
    /**
     * @notice Set a savings wallet address where claimed rewards will be sent.
     *         This allows mining phones (hot wallet) to claim without ever
     *         holding valuable tokens — they go straight to cold storage.
     * @param _wallet The destination address (Ledger, hardware wallet, etc.)
     *                Set to address(0) to clear and receive at msg.sender.
     */
    function setSavingsWallet(address _wallet) external {
        savingsWallet[msg.sender] = _wallet;
        emit SavingsWalletSet(msg.sender, _wallet);
    }

    // ── Owner: Stage merkle root (24hr timelock) ─────────────────────────
    /**
     * @notice Stage a new merkle root. It cannot be activated until 24 hours
     *         have passed, giving the community time to verify the tree.
     *         Leaf format: keccak256(abi.encode(address, claimableNow, vestingAmount, vestingDuration))
     * @param _root The merkle root for this epoch's reward tree
     */
    function setMerkleRoot(bytes32 _root) external onlyOwner {
        require(_root != bytes32(0), "Rewards: empty root");
        require(pendingRoot == bytes32(0), "Rewards: root already pending");

        pendingRoot = _root;
        pendingRootTimestamp = block.timestamp;

        emit MerkleRootStaged(_root, block.timestamp + TIMELOCK_DURATION);
    }

    // ── Owner: Activate merkle root after timelock ───────────────────────
    /**
     * @notice Activate the pending merkle root after the 24hr timelock has expired.
     *         Increments the epoch and makes the root available for claims.
     */
    function activateMerkleRoot() external onlyOwner {
        require(pendingRoot != bytes32(0), "Rewards: no pending root");
        require(
            block.timestamp >= pendingRootTimestamp + TIMELOCK_DURATION,
            "Rewards: timelock not expired"
        );

        currentEpoch++;
        merkleRoots[currentEpoch] = pendingRoot;

        emit MerkleRootActivated(currentEpoch, pendingRoot);

        pendingRoot = bytes32(0);
        pendingRootTimestamp = 0;
    }

    // ── Owner: Cancel pending merkle root ────────────────────────────────
    /**
     * @notice Cancel a staged merkle root before it is activated.
     *         Used if an error is discovered during the timelock window.
     */
    function cancelPendingRoot() external onlyOwner {
        require(pendingRoot != bytes32(0), "Rewards: no pending root");

        emit MerkleRootCancelled(pendingRoot);

        pendingRoot = bytes32(0);
        pendingRootTimestamp = 0;
    }

    // ── User: Claim rewards ──────────────────────────────────────────────
    /**
     * @notice Claim rewards for a specific epoch using a merkle proof.
     *         Immediate portion is sent to savings wallet (or msg.sender).
     *         Vesting portion is locked until vestingDuration elapses.
     * @param _epoch The epoch to claim for
     * @param _claimableNow Immediate reward amount
     * @param _vestingAmount Amount locked for vesting
     * @param _vestingDuration Seconds until vesting unlocks (0 if no vesting)
     * @param _proof The merkle proof path
     */
    function claim(
        uint256 _epoch,
        uint256 _claimableNow,
        uint256 _vestingAmount,
        uint256 _vestingDuration,
        bytes32[] calldata _proof
    ) external {
        require(_epoch > 0 && _epoch <= currentEpoch, "Rewards: invalid epoch");
        require(!hasClaimed[_epoch][msg.sender], "Rewards: already claimed");
        require(_claimableNow > 0 || _vestingAmount > 0, "Rewards: zero amount");

        // Verify merkle proof (double-hash to match OpenZeppelin StandardMerkleTree)
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(
            msg.sender, _claimableNow, _vestingAmount, _vestingDuration
        ))));
        require(
            MerkleProof.verify(_proof, merkleRoots[_epoch], leaf),
            "Rewards: invalid proof"
        );

        hasClaimed[_epoch][msg.sender] = true;

        address recipient = savingsWallet[msg.sender];
        if (recipient == address(0)) {
            recipient = msg.sender;
        }

        uint256 vestingUnlocksAt;

        // Send immediate portion
        if (_claimableNow > 0) {
            totalDistributed += _claimableNow;
            token.safeTransfer(recipient, _claimableNow);
        }

        // Record vesting portion
        if (_vestingAmount > 0) {
            vestingUnlocksAt = block.timestamp + _vestingDuration;
            vesting[msg.sender][_epoch] = VestingInfo({
                amount: _vestingAmount,
                unlocksAt: vestingUnlocksAt,
                released: false
            });
            totalVesting += _vestingAmount;
        }

        emit RewardsClaimed(
            _epoch, msg.sender, recipient,
            _claimableNow, _vestingAmount, vestingUnlocksAt
        );
    }

    // ── User: Batch claim multiple epochs ────────────────────────────────
    /**
     * @notice Claim rewards for multiple epochs in a single transaction.
     * @param _epochs Array of epoch numbers
     * @param _claimableNows Array of immediate amounts per epoch
     * @param _vestingAmounts Array of vesting amounts per epoch
     * @param _vestingDurations Array of vesting durations per epoch
     * @param _proofs Array of merkle proofs per epoch
     */
    function claimBatch(
        uint256[] calldata _epochs,
        uint256[] calldata _claimableNows,
        uint256[] calldata _vestingAmounts,
        uint256[] calldata _vestingDurations,
        bytes32[][] calldata _proofs
    ) external {
        require(_epochs.length == _claimableNows.length, "Rewards: length mismatch");
        require(_epochs.length == _vestingAmounts.length, "Rewards: length mismatch");
        require(_epochs.length == _vestingDurations.length, "Rewards: length mismatch");
        require(_epochs.length == _proofs.length, "Rewards: length mismatch");

        address recipient = savingsWallet[msg.sender];
        if (recipient == address(0)) {
            recipient = msg.sender;
        }

        uint256 totalImmediate;
        uint256 totalVestingAdded;

        for (uint256 i = 0; i < _epochs.length; i++) {
            uint256 epoch = _epochs[i];
            uint256 claimableNow = _claimableNows[i];
            uint256 vestingAmount = _vestingAmounts[i];
            uint256 vestingDuration = _vestingDurations[i];

            require(epoch > 0 && epoch <= currentEpoch, "Rewards: invalid epoch");
            require(!hasClaimed[epoch][msg.sender], "Rewards: already claimed");
            require(claimableNow > 0 || vestingAmount > 0, "Rewards: zero amount");

            bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(
                msg.sender, claimableNow, vestingAmount, vestingDuration
            ))));
            require(
                MerkleProof.verify(_proofs[i], merkleRoots[epoch], leaf),
                "Rewards: invalid proof"
            );

            hasClaimed[epoch][msg.sender] = true;
            totalImmediate += claimableNow;

            uint256 vestingUnlocksAt;
            if (vestingAmount > 0) {
                vestingUnlocksAt = block.timestamp + vestingDuration;
                vesting[msg.sender][epoch] = VestingInfo({
                    amount: vestingAmount,
                    unlocksAt: vestingUnlocksAt,
                    released: false
                });
                totalVestingAdded += vestingAmount;
            }

            emit RewardsClaimed(
                epoch, msg.sender, recipient,
                claimableNow, vestingAmount, vestingUnlocksAt
            );
        }

        totalDistributed += totalImmediate;
        totalVesting += totalVestingAdded;

        if (totalImmediate > 0) {
            token.safeTransfer(recipient, totalImmediate);
        }
    }

    // ── User: Release vested tokens ──────────────────────────────────────
    /**
     * @notice Release vested tokens for a specific epoch after the vesting
     *         period has elapsed. Tokens go to savings wallet if set.
     * @param _epoch The epoch whose vesting to release
     */
    function releaseVested(uint256 _epoch) external {
        VestingInfo storage v = vesting[msg.sender][_epoch];
        require(v.amount > 0, "Rewards: no vesting");
        require(!v.released, "Rewards: already released");
        require(block.timestamp >= v.unlocksAt, "Rewards: still vesting");

        v.released = true;
        uint256 amount = v.amount;
        totalVesting -= amount;
        totalDistributed += amount;

        address recipient = savingsWallet[msg.sender];
        if (recipient == address(0)) {
            recipient = msg.sender;
        }

        token.safeTransfer(recipient, amount);
        emit VestingReleased(_epoch, msg.sender, recipient, amount);
    }

    // ── User: Batch release vested tokens ────────────────────────────────
    /**
     * @notice Release vested tokens for multiple epochs in one transaction.
     * @param _epochs Array of epochs whose vesting to release
     */
    function releaseVestedBatch(uint256[] calldata _epochs) external {
        address recipient = savingsWallet[msg.sender];
        if (recipient == address(0)) {
            recipient = msg.sender;
        }

        uint256 totalAmount;
        for (uint256 i = 0; i < _epochs.length; i++) {
            VestingInfo storage v = vesting[msg.sender][_epochs[i]];
            require(v.amount > 0, "Rewards: no vesting");
            require(!v.released, "Rewards: already released");
            require(block.timestamp >= v.unlocksAt, "Rewards: still vesting");

            v.released = true;
            totalAmount += v.amount;

            emit VestingReleased(_epochs[i], msg.sender, recipient, v.amount);
        }

        totalVesting -= totalAmount;
        totalDistributed += totalAmount;
        token.safeTransfer(recipient, totalAmount);
    }

    // ── View: Contract token balance ─────────────────────────────────────
    function rewardsRemaining() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    // ── View: Available balance (excludes locked vesting) ────────────────
    function rewardsAvailable() external view returns (uint256) {
        return token.balanceOf(address(this)) - totalVesting;
    }
}
