// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title POHCharity — Charity Treasury
 * @notice Holds charity funds collected from POH transaction fees.
 *         Owner (founder, later DAO) can distribute to verified charity addresses.
 *
 * Features:
 *   - Timelock: Distributions must be proposed and then executed after a delay.
 *   - On-chain transparency: Every distribution is logged with recipient and reason.
 *   - Supports both POH token and ETH distributions.
 */
contract POHCharity is Ownable {
    using SafeERC20 for IERC20;

    // ── Timelock ────────────────────────────────────────────────────────
    uint256 public constant MIN_DELAY = 24 hours;
    uint256 public timelockDelay = 24 hours;

    struct Proposal {
        address token;      // address(0) for ETH
        address recipient;
        uint256 amount;
        string reason;
        uint256 executeAfter;
        bool executed;
        bool cancelled;
    }

    Proposal[] public proposals;

    // ── Events ──────────────────────────────────────────────────────────
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed token,
        address indexed recipient,
        uint256 amount,
        string reason,
        uint256 executeAfter
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event TimelockDelayUpdated(uint256 oldDelay, uint256 newDelay);

    constructor() Ownable(msg.sender) {}

    // ── Propose a distribution ──────────────────────────────────────────
    /**
     * @notice Propose a charity distribution. Must wait `timelockDelay` before execution.
     * @param _token Token address (address(0) for ETH)
     * @param _recipient Charity wallet receiving funds
     * @param _amount Amount to distribute
     * @param _reason Human-readable reason (stored on-chain for transparency)
     */
    function propose(
        address _token,
        address _recipient,
        uint256 _amount,
        string calldata _reason
    ) external onlyOwner returns (uint256) {
        require(_recipient != address(0), "Charity: recipient is zero");
        require(_amount > 0, "Charity: amount is zero");
        require(bytes(_reason).length > 0, "Charity: reason required");

        uint256 proposalId = proposals.length;
        uint256 executeAfter = block.timestamp + timelockDelay;

        proposals.push(Proposal({
            token: _token,
            recipient: _recipient,
            amount: _amount,
            reason: _reason,
            executeAfter: executeAfter,
            executed: false,
            cancelled: false
        }));

        emit ProposalCreated(proposalId, _token, _recipient, _amount, _reason, executeAfter);
        return proposalId;
    }

    // ── Execute a proposal ──────────────────────────────────────────────
    /**
     * @notice Execute a previously proposed distribution after the timelock.
     */
    function execute(uint256 _proposalId) external onlyOwner {
        Proposal storage p = proposals[_proposalId];
        require(!p.executed, "Charity: already executed");
        require(!p.cancelled, "Charity: cancelled");
        require(block.timestamp >= p.executeAfter, "Charity: timelock not expired");

        p.executed = true;

        if (p.token == address(0)) {
            // ETH distribution
            require(address(this).balance >= p.amount, "Charity: insufficient ETH");
            (bool success, ) = p.recipient.call{value: p.amount}("");
            require(success, "Charity: ETH transfer failed");
        } else {
            // ERC20 distribution
            IERC20(p.token).safeTransfer(p.recipient, p.amount);
        }

        emit ProposalExecuted(_proposalId);
    }

    // ── Cancel a proposal ───────────────────────────────────────────────
    function cancel(uint256 _proposalId) external onlyOwner {
        Proposal storage p = proposals[_proposalId];
        require(!p.executed, "Charity: already executed");
        require(!p.cancelled, "Charity: already cancelled");

        p.cancelled = true;
        emit ProposalCancelled(_proposalId);
    }

    // ── Admin: Update timelock delay ────────────────────────────────────
    function setTimelockDelay(uint256 _delay) external onlyOwner {
        require(_delay >= MIN_DELAY, "Charity: delay below minimum");
        emit TimelockDelayUpdated(timelockDelay, _delay);
        timelockDelay = _delay;
    }

    // ── View helpers ────────────────────────────────────────────────────
    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getProposal(uint256 _id) external view returns (
        address token,
        address recipient,
        uint256 amount,
        string memory reason,
        uint256 executeAfter,
        bool executed,
        bool cancelled
    ) {
        Proposal storage p = proposals[_id];
        return (p.token, p.recipient, p.amount, p.reason, p.executeAfter, p.executed, p.cancelled);
    }

    // ── Receive ETH ─────────────────────────────────────────────────────
    receive() external payable {}
}
