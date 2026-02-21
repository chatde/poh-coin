// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title POHVesting — Founder Token Vesting
 * @notice Holds 10% of POH supply with a 6-month cliff and 4-year linear vesting.
 *
 * Schedule:
 *   - Cliff:   6 months after start (nothing unlocks before this)
 *   - Vesting: Linear over 4 years after cliff (total lock period = 4.5 years)
 *   - Immutable: Schedule cannot be changed or accelerated after deployment.
 *
 * The beneficiary can call release() at any time after the cliff to withdraw
 * their currently vested tokens.
 */
contract POHVesting {
    using SafeERC20 for IERC20;

    // ── Immutable state ─────────────────────────────────────────────────
    IERC20 public immutable token;
    address public immutable beneficiary;
    uint256 public immutable startTime;
    uint256 public immutable cliffEnd;       // startTime + 6 months
    uint256 public immutable vestingEnd;     // cliffEnd + 4 years
    uint256 public immutable totalAllocation;

    // ── Mutable state ───────────────────────────────────────────────────
    uint256 public released;

    // ── Events ──────────────────────────────────────────────────────────
    event TokensReleased(address indexed beneficiary, uint256 amount);

    // ── Constants ───────────────────────────────────────────────────────
    uint256 private constant CLIFF_DURATION = 180 days;    // ~6 months
    uint256 private constant VESTING_DURATION = 1460 days; // ~4 years

    constructor(
        address _token,
        address _beneficiary,
        uint256 _totalAllocation
    ) {
        require(_token != address(0), "Vesting: token is zero");
        require(_beneficiary != address(0), "Vesting: beneficiary is zero");
        require(_totalAllocation > 0, "Vesting: allocation is zero");

        token = IERC20(_token);
        beneficiary = _beneficiary;
        totalAllocation = _totalAllocation;

        startTime = block.timestamp;
        cliffEnd = block.timestamp + CLIFF_DURATION;
        vestingEnd = block.timestamp + CLIFF_DURATION + VESTING_DURATION;
    }

    /**
     * @notice Returns the amount of tokens that have vested up to now.
     */
    function vestedAmount() public view returns (uint256) {
        if (block.timestamp < cliffEnd) {
            return 0;
        }
        if (block.timestamp >= vestingEnd) {
            return totalAllocation;
        }
        // Linear vesting between cliffEnd and vestingEnd
        uint256 elapsed = block.timestamp - cliffEnd;
        return (totalAllocation * elapsed) / VESTING_DURATION;
    }

    /**
     * @notice Returns the amount of tokens currently available to release.
     */
    function releasable() public view returns (uint256) {
        return vestedAmount() - released;
    }

    /**
     * @notice Release vested tokens to the beneficiary.
     * @dev Anyone can call this, but tokens always go to the beneficiary.
     */
    function release() external {
        uint256 amount = releasable();
        require(amount > 0, "Vesting: nothing to release");

        released += amount;
        token.safeTransfer(beneficiary, amount);

        emit TokensReleased(beneficiary, amount);
    }

    /**
     * @notice View: time remaining until cliff ends.
     */
    function timeUntilCliff() external view returns (uint256) {
        if (block.timestamp >= cliffEnd) return 0;
        return cliffEnd - block.timestamp;
    }

    /**
     * @notice View: time remaining until full vesting.
     */
    function timeUntilFullyVested() external view returns (uint256) {
        if (block.timestamp >= vestingEnd) return 0;
        return vestingEnd - block.timestamp;
    }

    /**
     * @notice View: percentage of tokens vested (basis points, 10000 = 100%).
     */
    function vestedPercentageBps() external view returns (uint256) {
        if (totalAllocation == 0) return 0;
        return (vestedAmount() * 10_000) / totalAllocation;
    }
}
