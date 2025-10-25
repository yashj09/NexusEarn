// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";
import "./interfaces/IAavePool.sol";

/**
 * @title CrossYieldVault
 * @notice Main vault contract for cross-chain yield aggregation
 * @dev Works with Avail Nexus for cross-chain operations
 */
contract CrossYieldVault {
    struct UserDeposit {
        uint256 amount;
        uint256 depositTime;
        uint256 lastClaimTime;
    }

    mapping(address => mapping(address => UserDeposit)) public userDeposits;
    mapping(address => address) public tokenToProtocol; // token -> protocol address
    mapping(address => bool) public supportedTokens;

    address public owner;
    uint256 public totalValueLocked;
    uint256 public constant MINIMUM_DEPOSIT = 1e6; // 1 USDC/USDT

    event Deposited(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event Withdrawn(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event YieldClaimed(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event ProtocolUpdated(address indexed token, address indexed protocol);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Deposit tokens into vault
     * @dev Automatically routes to best yield protocol
     */
    function deposit(address token, uint256 amount) external {
        require(supportedTokens[token], "Token not supported");
        require(amount >= MINIMUM_DEPOSIT, "Amount too small");

        IERC20 tokenContract = IERC20(token);
        require(
            tokenContract.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        address protocol = tokenToProtocol[token];
        require(protocol != address(0), "No protocol set");

        // Approve and supply to protocol (e.g., Aave)
        tokenContract.approve(protocol, amount);
        IAavePool(protocol).supply(token, amount, address(this), 0);

        // Update user deposit
        UserDeposit storage userDeposit = userDeposits[msg.sender][token];
        userDeposit.amount += amount;
        userDeposit.depositTime = block.timestamp;
        userDeposit.lastClaimTime = block.timestamp;

        totalValueLocked += amount;

        emit Deposited(msg.sender, token, amount);
    }

    /**
     * @notice Withdraw tokens from vault
     */
    function withdraw(address token, uint256 amount) external {
        UserDeposit storage userDeposit = userDeposits[msg.sender][token];
        require(userDeposit.amount >= amount, "Insufficient balance");

        address protocol = tokenToProtocol[token];

        // Withdraw from protocol
        IAavePool(protocol).withdraw(token, amount, msg.sender);

        // Update state
        userDeposit.amount -= amount;
        totalValueLocked -= amount;

        emit Withdrawn(msg.sender, token, amount);
    }

    /**
     * @notice Claim accrued yield
     */
    function claimYield(address token) external {
        UserDeposit storage userDeposit = userDeposits[msg.sender][token];
        require(userDeposit.amount > 0, "No deposit");

        address protocol = tokenToProtocol[token];

        // Get current balance from protocol
        (uint256 totalCollateral, , , , , ) = IAavePool(protocol)
            .getUserAccountData(address(this));

        uint256 earned = totalCollateral - userDeposit.amount;
        if (earned > 0) {
            IAavePool(protocol).withdraw(token, earned, msg.sender);
            userDeposit.lastClaimTime = block.timestamp;

            emit YieldClaimed(msg.sender, token, earned);
        }
    }

    /**
     * @notice Emergency withdraw - bypass all checks
     */
    function emergencyWithdraw(address token) external {
        UserDeposit storage userDeposit = userDeposits[msg.sender][token];
        uint256 amount = userDeposit.amount;
        require(amount > 0, "No deposit");

        address protocol = tokenToProtocol[token];
        IAavePool(protocol).withdraw(token, amount, msg.sender);

        userDeposit.amount = 0;
        totalValueLocked -= amount;

        emit Withdrawn(msg.sender, token, amount);
    }

    // Admin functions
    function setProtocol(address token, address protocol) external onlyOwner {
        tokenToProtocol[token] = protocol;
        emit ProtocolUpdated(token, protocol);
    }

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    // View functions
    function getUserBalance(
        address user,
        address token
    ) external view returns (uint256) {
        return userDeposits[user][token].amount;
    }

    function getUserYield(
        address user,
        address token
    ) external view returns (uint256) {
        UserDeposit memory userDeposit = userDeposits[user][token];
        if (userDeposit.amount == 0) return 0;

        address protocol = tokenToProtocol[token];
        (uint256 totalCollateral, , , , , ) = IAavePool(protocol)
            .getUserAccountData(address(this));

        return
            totalCollateral > userDeposit.amount
                ? totalCollateral - userDeposit.amount
                : 0;
    }
}
