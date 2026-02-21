// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title POHNodeRegistry — Proof of Planet Node Registration
 * @notice Manages the registration and reputation of mining nodes in the
 *         Proof of Planet network. Supports two tiers:
 *
 *   Tier 1 — Data Nodes:       Any phone. Collect sensor data + run science compute.
 *   Tier 2 — Validation Nodes: More powerful devices. Cross-check and verify data.
 *
 * Features:
 *   - Device registration with unique device IDs
 *   - School program: batch-register devices under a school name (higher caps)
 *   - Validator staking: optional POH stake for premium validator rewards
 *   - Slashing: bad validators lose staked tokens
 *   - Reputation: on-chain reputation score tracked per address
 */
contract POHNodeRegistry is Ownable {
    using SafeERC20 for IERC20;

    // ── Constants ─────────────────────────────────────────────────────────
    uint8 public constant TIER_DATA = 1;
    uint8 public constant TIER_VALIDATOR = 2;
    uint256 public constant MIN_STAKE = 1000 ether; // 1,000 POH minimum stake

    // ── State ─────────────────────────────────────────────────────────────
    IERC20 public immutable token;

    struct Node {
        address owner;
        uint8 tier;
        bool active;
        uint256 registeredAt;
    }

    struct School {
        string name;
        address admin;
        uint256 registeredAt;
        uint256 nodeCount;
    }

    /// @notice Node data by device ID
    mapping(bytes32 => Node) public nodes;

    /// @notice All device IDs owned by an address
    mapping(address => bytes32[]) public ownerDevices;

    /// @notice School data by school ID (keccak256 of name)
    mapping(bytes32 => School) public schools;

    /// @notice Device ID → school ID (zero if not a school device)
    mapping(bytes32 => bytes32) public deviceSchool;

    /// @notice Validator stake amount per address
    mapping(address => uint256) public validatorStake;

    /// @notice Reputation score per address (starts at 0, increases with good behavior)
    mapping(address => uint256) public reputation;

    // ── Counters ──────────────────────────────────────────────────────────
    uint256 public totalNodes;
    uint256 public totalValidators;
    uint256 public totalSchools;
    uint256 public totalStaked;

    // ── Events ────────────────────────────────────────────────────────────
    event NodeRegistered(
        bytes32 indexed deviceId,
        address indexed owner,
        uint8 tier
    );
    event NodeDeactivated(bytes32 indexed deviceId, address indexed owner);
    event SchoolRegistered(
        bytes32 indexed schoolId,
        string name,
        address indexed admin,
        uint256 nodeCount
    );
    event StakeDeposited(address indexed validator, uint256 amount);
    event StakeWithdrawn(address indexed validator, uint256 amount);
    event ValidatorSlashed(
        address indexed validator,
        uint256 amount,
        string reason
    );
    event ReputationUpdated(address indexed node, uint256 newScore);

    // ── Constructor ───────────────────────────────────────────────────────
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Registry: token is zero");
        token = IERC20(_token);
    }

    // ── Register a node ───────────────────────────────────────────────────
    /**
     * @notice Register a device as a Data Node (tier 1) or Validation Node (tier 2).
     * @param _deviceId Unique device identifier (hash of device attestation)
     * @param _tier 1 = Data Node, 2 = Validation Node
     */
    function registerNode(bytes32 _deviceId, uint8 _tier) external {
        require(_deviceId != bytes32(0), "Registry: empty device ID");
        require(_tier == TIER_DATA || _tier == TIER_VALIDATOR, "Registry: invalid tier");
        require(nodes[_deviceId].owner == address(0), "Registry: device already registered");

        nodes[_deviceId] = Node({
            owner: msg.sender,
            tier: _tier,
            active: true,
            registeredAt: block.timestamp
        });

        ownerDevices[msg.sender].push(_deviceId);
        totalNodes++;

        if (_tier == TIER_VALIDATOR) {
            totalValidators++;
        }

        emit NodeRegistered(_deviceId, msg.sender, _tier);
    }

    // ── Deactivate a node ─────────────────────────────────────────────────
    /**
     * @notice Deactivate a node. Only the node owner can deactivate.
     * @param _deviceId The device to deactivate
     */
    function deactivateNode(bytes32 _deviceId) external {
        Node storage node = nodes[_deviceId];
        require(node.owner == msg.sender, "Registry: not your device");
        require(node.active, "Registry: already inactive");

        node.active = false;
        totalNodes--;

        if (node.tier == TIER_VALIDATOR) {
            totalValidators--;
        }

        emit NodeDeactivated(_deviceId, msg.sender);
    }

    // ── Register a school ─────────────────────────────────────────────────
    /**
     * @notice Register a school with multiple devices. Schools get higher
     *         reward caps to incentivize educational participation.
     * @param _name Human-readable school name (stored on-chain)
     * @param _deviceIds Array of device IDs for the school's nodes
     */
    function registerSchool(
        string calldata _name,
        bytes32[] calldata _deviceIds
    ) external {
        require(bytes(_name).length > 0, "Registry: empty name");
        require(_deviceIds.length > 0, "Registry: no devices");

        bytes32 schoolId = keccak256(abi.encodePacked(_name, msg.sender));
        require(schools[schoolId].admin == address(0), "Registry: school exists");

        schools[schoolId] = School({
            name: _name,
            admin: msg.sender,
            registeredAt: block.timestamp,
            nodeCount: _deviceIds.length
        });

        for (uint256 i = 0; i < _deviceIds.length; i++) {
            bytes32 deviceId = _deviceIds[i];
            require(deviceId != bytes32(0), "Registry: empty device ID");
            require(nodes[deviceId].owner == address(0), "Registry: device already registered");

            nodes[deviceId] = Node({
                owner: msg.sender,
                tier: TIER_DATA,
                active: true,
                registeredAt: block.timestamp
            });

            ownerDevices[msg.sender].push(deviceId);
            deviceSchool[deviceId] = schoolId;
            totalNodes++;
        }

        totalSchools++;
        emit SchoolRegistered(schoolId, _name, msg.sender, _deviceIds.length);
    }

    // ── Validator staking ─────────────────────────────────────────────────
    /**
     * @notice Stake POH tokens to become a premium validator. Higher stake =
     *         higher trust and rewards. Must approve tokens first.
     * @param _amount Amount of POH to stake (minimum MIN_STAKE)
     */
    function stakeForValidation(uint256 _amount) external {
        require(_amount >= MIN_STAKE, "Registry: below minimum stake");

        token.safeTransferFrom(msg.sender, address(this), _amount);
        validatorStake[msg.sender] += _amount;
        totalStaked += _amount;

        emit StakeDeposited(msg.sender, _amount);
    }

    /**
     * @notice Withdraw staked tokens. Validators can unstake at any time,
     *         but lose premium rewards while unstaked.
     * @param _amount Amount of POH to withdraw
     */
    function unstake(uint256 _amount) external {
        require(_amount > 0, "Registry: zero amount");
        require(validatorStake[msg.sender] >= _amount, "Registry: insufficient stake");

        validatorStake[msg.sender] -= _amount;
        totalStaked -= _amount;

        token.safeTransfer(msg.sender, _amount);
        emit StakeWithdrawn(msg.sender, _amount);
    }

    // ── Owner: Slash a bad validator ──────────────────────────────────────
    /**
     * @notice Slash a validator's stake for approving fake data or malicious
     *         behavior. Slashed tokens are burned (sent to address(0) is not
     *         possible with SafeERC20, so they stay in the contract as a
     *         penalty pool for future redistribution).
     * @param _validator The validator to slash
     * @param _amount Amount to slash (cannot exceed their stake)
     * @param _reason Human-readable reason (stored in event for transparency)
     */
    function slashValidator(
        address _validator,
        uint256 _amount,
        string calldata _reason
    ) external onlyOwner {
        require(_amount > 0, "Registry: zero amount");
        require(validatorStake[_validator] >= _amount, "Registry: slash exceeds stake");
        require(bytes(_reason).length > 0, "Registry: reason required");

        validatorStake[_validator] -= _amount;
        totalStaked -= _amount;
        // Slashed tokens remain in contract as penalty pool

        // Reduce reputation
        if (reputation[_validator] >= 10) {
            reputation[_validator] -= 10;
        } else {
            reputation[_validator] = 0;
        }

        emit ValidatorSlashed(_validator, _amount, _reason);
        emit ReputationUpdated(_validator, reputation[_validator]);
    }

    // ── Owner: Update reputation ──────────────────────────────────────────
    /**
     * @notice Update a node operator's reputation score. Called by backend
     *         after validating data quality over time.
     * @param _node The node operator's address
     * @param _score New reputation score
     */
    function setReputation(address _node, uint256 _score) external onlyOwner {
        reputation[_node] = _score;
        emit ReputationUpdated(_node, _score);
    }

    /**
     * @notice Batch update reputation scores for multiple addresses.
     * @param _nodes Array of node operator addresses
     * @param _scores Array of new reputation scores
     */
    function setReputationBatch(
        address[] calldata _nodes,
        uint256[] calldata _scores
    ) external onlyOwner {
        require(_nodes.length == _scores.length, "Registry: length mismatch");

        for (uint256 i = 0; i < _nodes.length; i++) {
            reputation[_nodes[i]] = _scores[i];
            emit ReputationUpdated(_nodes[i], _scores[i]);
        }
    }

    // ── View: Get devices for an owner ────────────────────────────────────
    function getOwnerDevices(address _owner) external view returns (bytes32[] memory) {
        return ownerDevices[_owner];
    }

    /// @notice Get the number of devices registered by an address
    function getOwnerDeviceCount(address _owner) external view returns (uint256) {
        return ownerDevices[_owner].length;
    }

    /// @notice Check if a device is registered and active
    function isActiveNode(bytes32 _deviceId) external view returns (bool) {
        return nodes[_deviceId].active;
    }

    /// @notice Check if an address is a staked validator
    function isStakedValidator(address _addr) external view returns (bool) {
        return validatorStake[_addr] >= MIN_STAKE;
    }
}
