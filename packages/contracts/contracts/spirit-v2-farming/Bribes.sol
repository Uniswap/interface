// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "./utils.sol";

contract Owned {
    address public owner;
    address public nominatedOwner;

    constructor(address _owner) public {
        require(_owner != address(0), "Owner address cannot be 0");
        owner = _owner;
        emit OwnerChanged(address(0), _owner);
    }

    function nominateNewOwner(address _owner) external onlyOwner {
        nominatedOwner = _owner;
        emit OwnerNominated(_owner);
    }

    function acceptOwnership() external {
        require(
            msg.sender == nominatedOwner,
            "You must be nominated before you can accept ownership"
        );
        emit OwnerChanged(owner, nominatedOwner);
        owner = nominatedOwner;
        nominatedOwner = address(0);
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyOwner() private view {
        require(
            msg.sender == owner,
            "Only the contract owner may perform this action"
        );
    }

    event OwnerNominated(address newOwner);
    event OwnerChanged(address oldOwner, address newOwner);
}

contract Bribe is ReentrancyGuard, Owned {
    using SafeERC20 for IERC20;

    uint256 public constant DURATION = 7 days; // rewards are released over 7 days

    /* ========== STATE VARIABLES ========== */

    struct Reward {
        uint256 periodFinish;
        uint256 rewardRate;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
    }
    mapping(address => Reward) public rewardData;
    mapping(address => bool) public isRewardToken;
    address[] public rewardTokens;
    address public gaugeProxy;
    address public bribeFactory;

    // user -> reward token -> amount
    mapping(address => mapping(address => uint256))
        public userRewardPerTokenPaid;
    mapping(address => mapping(address => uint256)) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _owner,
        address _gaugeProxy,
        address _bribeFactory
    ) public Owned(_owner) {
        require(
            _bribeFactory != address(0) &&
                _gaugeProxy != address(0) &&
                _owner != address(0)
        );
        gaugeProxy = _gaugeProxy;
        bribeFactory = _bribeFactory;
    }

    function left(address _rewardsToken) external view returns (uint256 leftover) {
        if (block.timestamp >= rewardData[_rewardsToken].periodFinish) {
            leftover = 0;
        } else {
            uint256 remaining = rewardData[_rewardsToken].periodFinish - block.timestamp;
            leftover = remaining * rewardData[_rewardsToken].rewardRate;
        }
    }

    function addReward(address _rewardsToken) public {
        require(
            (msg.sender == owner || msg.sender == bribeFactory),
            "addReward: permission is denied!"
        );
        require(!isRewardToken[_rewardsToken], "Reward token already exists");
        isRewardToken[_rewardsToken] = true;
        rewardTokens.push(_rewardsToken);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable(address _rewardsToken)
        public
        view
        returns (uint256)
    {
        return
            Math.min(block.timestamp, rewardData[_rewardsToken].periodFinish);
    }

    function rewardPerToken(address _rewardsToken)
        public
        view
        returns (uint256)
    {
        if (_totalSupply == 0) {
            return rewardData[_rewardsToken].rewardPerTokenStored;
        }
        return
            rewardData[_rewardsToken].rewardPerTokenStored + ((lastTimeRewardApplicable(_rewardsToken) - rewardData[_rewardsToken].lastUpdateTime) 
            * rewardData[_rewardsToken].rewardRate * 1e18 / _totalSupply);
    }

    function earned(address account, address _rewardsToken)
        public
        view
        returns (uint256)
    {
        return
            (_balances[account] * (rewardPerToken(_rewardsToken) - userRewardPerTokenPaid[account][_rewardsToken]) / 1e18) 
            + rewards[account][_rewardsToken];
    }

    function getRewardForDuration(address _rewardsToken)
        external
        view
        returns (uint256)
    {
        return
            rewardData[_rewardsToken].rewardRate * DURATION;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function _deposit(uint256 amount, address voter)
        external
        nonReentrant
        updateReward(voter)
    {
        require(amount > 0, "Cannot stake 0");
        require(msg.sender == gaugeProxy);
        _totalSupply = _totalSupply + amount;
        _balances[voter] = _balances[voter] + amount;
        emit Staked(voter, amount);
    }

    function _withdraw(uint256 amount, address voter)
        public
        nonReentrant
        updateReward(voter)
    {
        require(amount > 0, "Cannot withdraw 0");
        require(msg.sender == gaugeProxy);
        // incase of bribe contract reset in gauge proxy
        if (amount <= _balances[voter]) {
            _totalSupply = _totalSupply - amount;
            _balances[voter] = _balances[voter] - amount;
            emit Withdrawn(voter, amount);
        }
    }

    function getRewardForOwner(address voter)
        public
        nonReentrant
        updateReward(voter)
    {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            address _rewardsToken = rewardTokens[i];
            uint256 reward = rewards[voter][_rewardsToken];
            if (reward > 0) {
                rewards[voter][_rewardsToken] = 0;
                IERC20(_rewardsToken).safeTransfer(voter, reward);
                emit RewardPaid(voter, _rewardsToken, reward);
            }
        }
    }

    function notifyRewardAmount(address _rewardsToken, uint256 reward)
        external
        nonReentrant
        updateReward(address(0))
    {
        require(reward >= DURATION, "reward amount should be greater than DURATION");
        require(isRewardToken[_rewardsToken], "reward token not verified");
        // handle the transfer of reward tokens via `transferFrom` to reduce the number
        // of transactions required and ensure correctness of the reward amount
        IERC20(_rewardsToken).safeTransferFrom(
            msg.sender,
            address(this),
            reward
        );
        
        if (block.timestamp >= rewardData[_rewardsToken].periodFinish) {
            rewardData[_rewardsToken].rewardRate = reward / DURATION;
        } else {
            uint256 remaining = rewardData[_rewardsToken].periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardData[_rewardsToken].rewardRate;
            require(
                reward > leftover,
                "reward amount should be greater than leftover amount"
            ); // to stop griefing attack
            rewardData[_rewardsToken].rewardRate = (reward + leftover) / DURATION;
        }

        rewardData[_rewardsToken].lastUpdateTime = block.timestamp;
        rewardData[_rewardsToken].periodFinish = block.timestamp + DURATION;
        emit RewardAdded(_rewardsToken, reward);
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function recoverERC20(address tokenAddress, uint256 tokenAmount)
        external
        onlyOwner
    {
        require(
            rewardData[tokenAddress].lastUpdateTime == 0,
            "Cannot withdraw reward token"
        );
        IERC20(tokenAddress).safeTransfer(owner, tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(address account) {
        for (uint256 i; i < rewardTokens.length; i++) {
            address token = rewardTokens[i];
            rewardData[token].rewardPerTokenStored = rewardPerToken(token);
            rewardData[token].lastUpdateTime = lastTimeRewardApplicable(token);
            if (account != address(0)) {
                rewards[account][token] = earned(account, token);
                userRewardPerTokenPaid[account][token] = rewardData[token]
                    .rewardPerTokenStored;
            }
        }
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(address rewardToken, uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(
        address indexed user,
        address indexed rewardsToken,
        uint256 reward
    );
    event Recovered(address token, uint256 amount);
}

contract BribeFactory {
    address public last_bribe;

    function createBribe(
        address _owner,
        address _token0,
        address _token1
    ) external returns (address) {
        Bribe lastBribe = new Bribe(
            _owner,
            msg.sender,
            address(this)
        );
        lastBribe.addReward(_token0);
        lastBribe.addReward(_token1);
        last_bribe = address(lastBribe);
        return last_bribe;
    }
}
