// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./utils.sol";

contract AdminGauge is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public rewardToken;
    IERC20 public governanceToken;

    IERC20 public immutable TOKEN;
    address public immutable DISTRIBUTION;
    uint256 public constant DURATION = 7 days;

    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    modifier onlyDistribution() {
        require(
            msg.sender == DISTRIBUTION,
            "Caller is not RewardsDistribution contract"
        );
        _;
    }

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    uint256 public derivedSupply;
    mapping(address => uint256) private _balances;
    mapping(address => uint256) public derivedBalances;
    mapping(address => uint256) private _base;

    constructor(
        address _spirit,
        address _inSpirit,
        address _token
    ) public {
        rewardToken = IERC20(_spirit);
        governanceToken = IERC20(_inSpirit);
        TOKEN = IERC20(_token);
        DISTRIBUTION = msg.sender;
    }

    function claimVotingFees() external nonReentrant returns (uint claimed0, uint claimed1) {
        // require address(TOKEN) is BaseV1Pair
        return _claimVotingFees();
    }

    function _claimVotingFees() internal returns (uint claimed0, uint claimed1) {
        (claimed0, claimed1) = IBaseV1Pair(address(TOKEN)).claimFees();
        if (claimed0 > 0 || claimed1 > 0) {
            (address _token0, address _token1) = IBaseV1Pair(address(TOKEN)).tokens();
            address spiritMaker = IBaseV1Pair(address(TOKEN)).spiritMaker();
            address protocolAddress = IBaseV1Pair(address(TOKEN)).protocol();
            if (claimed0 > 0) {
                IERC20(_token0).safeTransfer(spiritMaker, claimed0 / 2);
                IERC20(_token0).safeTransfer(protocolAddress, claimed0 / 2);
            }
            if (claimed1 > 0) {
                IERC20(_token1).safeTransfer(spiritMaker, claimed1 / 2);
                IERC20(_token1).safeTransfer(protocolAddress, claimed1 / 2);
            }
            emit ClaimVotingFees(msg.sender, claimed0, claimed1);
        }
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return Math.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (derivedSupply == 0) {
            return 0;
        }

        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18 / derivedSupply;
    }

    function derivedBalance(address account) public view returns (uint256) {
        if (governanceToken.totalSupply() == 0) return 0;
        uint256 _balance = _balances[account];
        uint256 _derived = _balance * 40 / 100;
        uint256 _adjusted = (_totalSupply * governanceToken.balanceOf(account) / governanceToken.totalSupply()) * 60 / 100;
        return Math.min(_derived + _adjusted, _balance);
    }

    function kick(address account) public {
        uint256 _derivedBalance = derivedBalances[account];
        derivedSupply = derivedSupply - _derivedBalance;
        _derivedBalance = derivedBalance(account);
        derivedBalances[account] = _derivedBalance;
        derivedSupply = derivedSupply + _derivedBalance;
    }

    function earned(address account) public view returns (uint256) {
        return (derivedBalances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18) + rewards[account];
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate * DURATION;
    }

    function depositAll() external {
        _deposit(TOKEN.balanceOf(msg.sender), msg.sender);
    }

    function deposit(uint256 amount) external {
        _deposit(amount, msg.sender);
    }

    function depositFor(uint256 amount, address account) external {
        _deposit(amount, account);
    }

    function _deposit(uint256 amount, address account)
        internal
        nonReentrant
        updateReward(account)
    {
        IGaugeProxy guageProxy = IGaugeProxy(DISTRIBUTION);
        address treasury = guageProxy.getTreasury();
        uint256 depositFeeRate = guageProxy.getDepositFeeRate();

        require(
            treasury != address(0x0),
            "deposit(Gauge): treasury haven't been set"
        );
        require(amount > 0, "deposit(Gauge): cannot stake 0");

        uint256 feeAmount = amount * depositFeeRate / 10000;
        uint256 userAmount = amount - feeAmount;

        _balances[account] = _balances[account] + userAmount;
        _totalSupply = _totalSupply + userAmount;

        TOKEN.safeTransferFrom(account, address(this), amount);
        TOKEN.safeTransfer(treasury, feeAmount);

        emit Staked(account, userAmount);
    }

    function withdrawAll() external {
        _withdraw(_balances[msg.sender]);
    }

    function withdraw(uint256 amount) external {
        _withdraw(amount);
    }

    function _withdraw(uint256 amount)
        internal
        nonReentrant
        updateReward(msg.sender)
    {
        require(amount > 0, "Cannot withdraw 0");
        _totalSupply = _totalSupply - amount;
        _balances[msg.sender] = _balances[msg.sender] - amount;
        TOKEN.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function notifyRewardAmount(uint256 reward)
        external
        onlyDistribution
        updateReward(address(0))
    {
        rewardToken.safeTransferFrom(DISTRIBUTION, address(this), reward);
        if (block.timestamp >= periodFinish) {
            rewardRate = reward / DURATION;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / DURATION;
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint256 balance = rewardToken.balanceOf(address(this));
        require(
            rewardRate <= balance / DURATION,
            "Provided reward too high"
        );

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + DURATION;
        emit RewardAdded(reward);
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
        if (account != address(0)) {
            kick(account);
        }
    }

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event ClaimVotingFees(address indexed from, uint256 claimed0, uint256 claimed1);
}

//
//^0.7.5;






contract AdminGaugeProxy is ProtocolGovernance {
    using SafeERC20 for IERC20;

    MasterChef public MASTER;
    IERC20 public governanceToken;
    IERC20 public rewardToken;
    IERC20 public immutable TOKEN; // mInSpirit

    uint256 public pid = type(uint256).max; // -1 means 0xFFF....F and hasn't been set yet
    uint256 public depositFeeRate = 0; // EX: 3000 = 30% : MAXIMUM-2000

    // VE bool
    bool public ve = false;
    address public feeDistAddr; // fee distributor address

    address[] internal _tokens;
    address public treasury;
    address public admin; //Admin address to manage gauges like add/deprecate/resurrect
    uint256 public totalWeight; // total weight of gauges
    mapping(address => address) public gauges; // token => gauge
    mapping(address => uint256) public gaugeWeights; // token => weight

    constructor(
        address _masterChef,
        address _spirit,
        address _inSpirit,
        address _treasury,
        address _feeDist,
        uint256 _depositFeeRate
    ) public {
        MASTER = MasterChef(_masterChef);
        rewardToken = IERC20(_spirit);
        governanceToken = IERC20(_inSpirit);
        TOKEN = IERC20(address(new MasterDill()));
        governance = msg.sender;
        admin = msg.sender;
        treasury = _treasury;
        depositFeeRate = _depositFeeRate;
        feeDistAddr = _feeDist;
    }

    function tokens() external view returns (address[] memory) {
        return _tokens;
    }

    function getGauge(address _token) external view returns (address) {
        return gauges[_token];
    }

    function setAdmin(address _admin) external {
        require(msg.sender == governance, "!gov");
        admin = _admin;
    }

    // Add new token gauge
    function addGauge(address _token) external returns (address) {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        require(
            treasury != address(0x0),
            "addGauge: treaury should be set before every action"
        );
        require(gauges[_token] == address(0x0), "exists");
        gauges[_token] = address(
            new AdminGauge( address(rewardToken), address(governanceToken), _token)
        );
        gaugeWeights[_token] = 0;
        _tokens.push(_token);
        return gauges[_token];
    }

    // Set Gauge Weight for Token
    function setGaugeWeight(address _token, uint256 _weight) external {
        require(msg.sender == governance || msg.sender == admin);
        require(gauges[_token] != address(0x0), "!exists");
        totalWeight = totalWeight - gaugeWeights[_token] + _weight;
        gaugeWeights[_token] = _weight;
    }

    // Sets MasterChef PID
    function setPID(uint256 _pid) external {
        require(msg.sender == governance, "!gov");
        pid = _pid;
    }

    // Deposits minSPIRIT into MasterChef
    function deposit() public {
        require(pid != type(uint256).max, "pid not initialized");
        IERC20 _token = TOKEN;
        uint256 _balance = _token.balanceOf(address(this));
        _token.safeApprove(address(MASTER), 0);
        _token.safeApprove(address(MASTER), _balance);

        MASTER.deposit(pid, _balance);
    }

    // Fetches Spirit
    function collect() public {
        (uint256 _locked, ) = MASTER.userInfo(pid, address(this));
        MASTER.withdraw(pid, _locked);
        deposit();
    }

    function length() external view returns (uint256) {
        return _tokens.length;
    }

    // In this GaugeProxy the distribution will be equal amongst active gauges, irrespective of votes
    function distribute() external {
        collect();
        uint256 _balance = rewardToken.balanceOf(address(this));
        uint256 _inSpiritRewards = 0;
        if (ve) {
            uint256 _lockedSpirit = rewardToken.balanceOf(address(governanceToken));
            uint256 _spiritSupply = rewardToken.totalSupply();
            _inSpiritRewards = _balance * _lockedSpirit / _spiritSupply;

            if (_inSpiritRewards > 0) {
                rewardToken.safeTransfer(feeDistAddr, _inSpiritRewards);
                _balance = _balance - _inSpiritRewards;
            }
        }
        if (_balance > 0) {
            for (uint256 i = 0; i < _tokens.length; i++) {
                if (gaugeWeights[_tokens[i]] > 0) {
                    uint256 _reward = _balance * gaugeWeights[_tokens[i]] / totalWeight;
                    address _token = _tokens[i];
                    address _gauge = gauges[_token];
                    if (_reward > 0) {
                        rewardToken.safeApprove(_gauge, 0);
                        rewardToken.safeApprove(_gauge, _reward);
                        AdminGauge( _gauge).notifyRewardAmount(_reward);
                    }
                }
            }
        }
        emit Distributed(_inSpiritRewards);
    }

    function toggleVE() external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "turnVeOn: permission is denied!"
        );
        ve = !ve;
    }

    function getDepositFeeRate() external view returns (uint256) {
        return depositFeeRate;
    }

    function updateDepositFeeRate(uint256 _depositFeeRate) external {
        require(
            msg.sender == governance,
            "updateDepositFeeRate: permission is denied!"
        );
        require(
            _depositFeeRate <= 2000,
            "updateDepositFeeRate: cannot execeed the 20%!"
        );
        depositFeeRate = _depositFeeRate;
    }

    function getTreasury() external view returns (address) {
        return treasury;
    }

    // Update fee distributor address
    function updateFeeDistributor(address _feeDistAddr) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "updateFeeDestributor: permission is denied!"
        );
        feeDistAddr = _feeDistAddr;
    }

    function updateTreasury(address _treasury) external {
        require(
            msg.sender == governance,
            "updateTreasury: permission is denied!"
        );
        treasury = _treasury;
    }

    event Distributed(uint256 spiritRewards);
}