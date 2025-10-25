// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";
import "./interfaces/IYieldProtocol.sol";

/**
 * @title YieldStrategyManager
 * @notice Manages yield strategy configurations and protocol interactions
 */
contract YieldStrategyManager {
    struct YieldStrategy {
        address protocolAddress;
        address tokenAddress;
        uint256 allocatedAmount;
        uint256 lastRebalanceTime;
        bool isActive;
    }

    mapping(address => mapping(bytes32 => YieldStrategy)) public userStrategies;
    mapping(address => bool) public supportedProtocols;
    mapping(address => bool) public supportedTokens;

    address public owner;
    uint256 public minimumRebalanceInterval = 1 days;

    event StrategyCreated(address indexed user, bytes32 indexed strategyId);
    event StrategyUpdated(address indexed user, bytes32 indexed strategyId);
    event Deposited(
        address indexed user,
        bytes32 indexed strategyId,
        uint256 amount
    );
    event Withdrawn(
        address indexed user,
        bytes32 indexed strategyId,
        uint256 amount
    );
    event Rebalanced(
        address indexed user,
        bytes32 fromStrategy,
        bytes32 toStrategy,
        uint256 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Create a new yield strategy
     */
    function createStrategy(
        bytes32 strategyId,
        address protocolAddress,
        address tokenAddress
    ) external {
        require(supportedProtocols[protocolAddress], "Protocol not supported");
        require(supportedTokens[tokenAddress], "Token not supported");
        require(
            !userStrategies[msg.sender][strategyId].isActive,
            "Strategy already exists"
        );

        userStrategies[msg.sender][strategyId] = YieldStrategy({
            protocolAddress: protocolAddress,
            tokenAddress: tokenAddress,
            allocatedAmount: 0,
            lastRebalanceTime: block.timestamp,
            isActive: true
        });

        emit StrategyCreated(msg.sender, strategyId);
    }

    /**
     * @notice Deposit tokens into yield strategy
     */
    function deposit(bytes32 strategyId, uint256 amount) external {
        YieldStrategy storage strategy = userStrategies[msg.sender][strategyId];
        require(strategy.isActive, "Strategy not active");
        require(amount > 0, "Amount must be > 0");

        IERC20 token = IERC20(strategy.tokenAddress);
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // Approve protocol
        token.approve(strategy.protocolAddress, amount);

        // Deposit to protocol
        IYieldProtocol protocol = IYieldProtocol(strategy.protocolAddress);
        protocol.deposit(amount, msg.sender);

        strategy.allocatedAmount += amount;

        emit Deposited(msg.sender, strategyId, amount);
    }

    /**
     * @notice Withdraw tokens from yield strategy
     */
    function withdraw(bytes32 strategyId, uint256 amount) external {
        YieldStrategy storage strategy = userStrategies[msg.sender][strategyId];
        require(strategy.isActive, "Strategy not active");
        require(amount <= strategy.allocatedAmount, "Insufficient balance");

        IYieldProtocol protocol = IYieldProtocol(strategy.protocolAddress);
        uint256 withdrawn = protocol.withdraw(amount, msg.sender);

        strategy.allocatedAmount -= amount;

        emit Withdrawn(msg.sender, strategyId, withdrawn);
    }

    /**
     * @notice Rebalance between strategies
     */
    function rebalance(
        bytes32 fromStrategyId,
        bytes32 toStrategyId,
        uint256 amount
    ) external {
        YieldStrategy storage fromStrategy = userStrategies[msg.sender][
            fromStrategyId
        ];
        YieldStrategy storage toStrategy = userStrategies[msg.sender][
            toStrategyId
        ];

        require(
            fromStrategy.isActive && toStrategy.isActive,
            "Strategies must be active"
        );
        require(
            block.timestamp >=
                fromStrategy.lastRebalanceTime + minimumRebalanceInterval,
            "Too soon to rebalance"
        );
        require(amount <= fromStrategy.allocatedAmount, "Insufficient balance");

        // Withdraw from old strategy
        IYieldProtocol fromProtocol = IYieldProtocol(
            fromStrategy.protocolAddress
        );
        fromProtocol.withdraw(amount, address(this));

        // Deposit to new strategy
        IERC20 token = IERC20(toStrategy.tokenAddress);
        token.approve(toStrategy.protocolAddress, amount);

        IYieldProtocol toProtocol = IYieldProtocol(toStrategy.protocolAddress);
        toProtocol.deposit(amount, msg.sender);

        // Update balances
        fromStrategy.allocatedAmount -= amount;
        toStrategy.allocatedAmount += amount;
        fromStrategy.lastRebalanceTime = block.timestamp;

        emit Rebalanced(msg.sender, fromStrategyId, toStrategyId, amount);
    }

    /**
     * @notice Emergency withdraw all funds
     */
    function emergencyWithdraw(bytes32 strategyId) external {
        YieldStrategy storage strategy = userStrategies[msg.sender][strategyId];
        require(strategy.isActive, "Strategy not active");

        uint256 amount = strategy.allocatedAmount;
        IYieldProtocol protocol = IYieldProtocol(strategy.protocolAddress);
        protocol.withdraw(amount, msg.sender);

        strategy.allocatedAmount = 0;
        strategy.isActive = false;

        emit Withdrawn(msg.sender, strategyId, amount);
    }

    // Admin functions
    function addSupportedProtocol(address protocol) external onlyOwner {
        supportedProtocols[protocol] = true;
    }

    function removeSupportedProtocol(address protocol) external onlyOwner {
        supportedProtocols[protocol] = false;
    }

    function addSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = true;
    }

    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
    }

    function setMinimumRebalanceInterval(uint256 interval) external onlyOwner {
        minimumRebalanceInterval = interval;
    }

    // View functions
    function getStrategy(
        address user,
        bytes32 strategyId
    ) external view returns (YieldStrategy memory) {
        return userStrategies[user][strategyId];
    }
}
