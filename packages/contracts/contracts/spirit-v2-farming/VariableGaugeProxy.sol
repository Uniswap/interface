// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;
import "./utils.sol";

contract VariableGauge is ReentrancyGuard {
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

    uint256 public fees0;
    uint256 public fees1;

    address public gaugeProxy;

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
        address _token, 
        address _gaugeProxy
    ) public {
        rewardToken = IERC20(_spirit);
        governanceToken = IERC20(_inSpirit);
        TOKEN = IERC20(_token);
        gaugeProxy = _gaugeProxy;
        DISTRIBUTION = msg.sender;
    }

    function claimVotingFees() external nonReentrant returns (uint claimed0, uint claimed1) {
        // require address(TOKEN) is BaseV1Pair
        return _claimVotingFees();
    }

    function _claimVotingFees() internal returns (uint claimed0, uint claimed1) {
        (claimed0, claimed1) = IBaseV1Pair(address(TOKEN)).claimFees();
        address bribe = IGaugeProxy(gaugeProxy).bribes(address(this));
        if (claimed0 > 0 || claimed1 > 0) {
            uint _fees0 = fees0 + claimed0;
            uint _fees1 = fees1 + claimed1;
            (address _token0, address _token1) = IBaseV1Pair(address(TOKEN)).tokens();
            if (_fees0 > IBribe(bribe).left(_token0) && _fees0 / DURATION > 0) {
                fees0 = 0;
                IERC20(_token0).safeApprove(bribe, _fees0);
                IBribe(bribe).notifyRewardAmount(_token0, _fees0);
            } else {
                fees0 = _fees0;
            }
            if (_fees1 > IBribe(bribe).left(_token1) && _fees1 / DURATION > 0) {
                fees1 = 0;
                IERC20(_token1).safeApprove(bribe, _fees1);
                IBribe(bribe).notifyRewardAmount(_token1, _fees1);
            } else {
                fees1 = _fees1;
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
        return rewardPerTokenStored + ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18 / derivedSupply);
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
        require(amount > 0, "deposit(Gauge): cannot stake 0");

        uint256 userAmount = amount;

        _balances[account] = _balances[account] + userAmount;
        _totalSupply = _totalSupply + userAmount;

        TOKEN.safeTransferFrom(account, address(this), amount);

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









contract VariableGaugeProxy is ProtocolGovernance, ReentrancyGuard {
    using SafeERC20 for IERC20;

    MasterChef public MASTER;
    IERC20 public governanceToken;
    IERC20 public rewardToken;
    IERC20 public immutable TOKEN; // mInSpirit

    address public admin; //Admin address to manage gauges like add/deprecate/resurrect
    uint256 public minFee = 100 ether;

    // Address for bribeFactory
    address public bribeFactory;
    uint256 public immutable MIN_INSPIRIT_FOR_VERIFY = 1e23; // 100k inSPIRIT

    uint256 public pid = type(uint256).max; // -1 means 0xFFF....F and hasn't been set yet
    uint256 public totalWeight;

    // Time delays
    uint256 public voteDelay = 604800;
    uint256 public distributeDelay = 604800;
    uint256 public lastDistribute;
    mapping(address => uint256) public lastVote; // msg.sender => time of users last vote

    // V2 added variables for pre-distribute
    uint256 public lockedTotalWeight;
    uint256 public lockedBalance;
    uint256 public locktime;
    mapping(address => uint256) public lockedWeights; // token => weight
    mapping(address => bool) public hasDistributed; // LPtoken => bool

    // Variables verified tokens
    mapping(address => bool) public verifiedTokens; // verified tokens
    mapping(address => bool) public baseTokens; // Base tokens 
    address public pairFactory;

    // VE bool
    bool public ve = false;

    address[] internal _tokens;
    address public feeDistAddr; // fee distributor address
    mapping(address => address) public gauges; // token => gauge
    mapping(address => bool) public gaugeStatus; // token => bool : false = deprecated

    // Add Guage to Bribe Mapping
    mapping(address => address) public bribes; // gauge => bribes
    mapping(address => uint256) public weights; // token => weight
    mapping(address => mapping(address => uint256)) public votes; // msg.sender => votes
    mapping(address => address[]) public tokenVote; // msg.sender => token
    mapping(address => uint256) public usedWeights; // msg.sender => total voting weight of user

    // Modifiers
    modifier hasVoted(address voter) {
        uint256 time = block.timestamp - lastVote[voter];
        require(time > voteDelay, "You voted in the last 7 days");
        _;
    }

    modifier hasDistribute() {
        uint256 time = block.timestamp - lastDistribute;
        require(
            time > distributeDelay,
            "this has been distributed in the last 7 days"
        );
        _;
    }

    constructor(
        address _masterChef,
        address _spirit,
        address _inSpirit,
        address _feeDist,
        address _bribeFactory, 
        address _pairFactory
    ) public {
        MASTER = MasterChef(_masterChef);
        rewardToken = IERC20(_spirit);
        governanceToken = IERC20(_inSpirit);
        TOKEN = IERC20(address(new MasterDill()));
        governance = msg.sender;
        admin = msg.sender;
        feeDistAddr = _feeDist;
        bribeFactory = _bribeFactory;
        pairFactory = _pairFactory;
    }

    function tokens() external view returns (address[] memory) {
        return _tokens;
    }

    function getGauge(address _token) external view returns (address) {
        return gauges[_token];
    }

    function getBribes(address _gauge) external view returns (address) {
        return bribes[_gauge];
    }

    function setBaseToken(address _tokenLP, bool _flag) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        baseTokens[_tokenLP] = _flag;
    }

    function setVerifiedToken(address _tokenLP, bool _flag) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        verifiedTokens[_tokenLP] = _flag;
    }

    // Reset votes to 0
    function reset() external {
        _reset(msg.sender);
    }

    // Reset votes to 0
    function _reset(address _owner) internal {
        address[] storage _tokenVote = tokenVote[_owner];
        uint256 _tokenVoteCnt = _tokenVote.length;

        for (uint256 i = 0; i < _tokenVoteCnt; i++) {
            address _token = _tokenVote[i];
            uint256 _votes = votes[_owner][_token];

            if (_votes > 0) {
                totalWeight = totalWeight - _votes;
                weights[_token] = weights[_token] - _votes;
                // Bribe vote withdrawal
                IBribe(bribes[gauges[_token]])._withdraw(
                    uint256(_votes),
                    _owner
                );
                votes[_owner][_token] = 0;
            }
        }

        delete tokenVote[_owner];
    }

    // Adjusts _owner's votes according to latest _owner's inSPIRIT balance
    function poke(address _owner) public {
        address[] memory _tokenVote = tokenVote[_owner];
        uint256 _tokenCnt = _tokenVote.length;
        uint256[] memory _weights = new uint256[](_tokenCnt);
        uint256 _prevUsedWeight = usedWeights[_owner];
        uint256 _weight = governanceToken.balanceOf(_owner);

        for (uint256 i = 0; i < _tokenCnt; i++) {
            // Need to make this reflect the value deposited into bribes, anyone should be able to call this on
            // other addresses to stop them from gaming the system with outdated votes that dont lose voting power
            uint256 _prevWeight = votes[_owner][_tokenVote[i]];
            _weights[i] = _prevWeight * _weight / _prevUsedWeight;
        }

        _vote(_owner, _tokenVote, _weights);
    }

    function _vote(
        address _owner,
        address[] memory _tokenVote,
        uint256[] memory _weights
    ) internal {
        // _weights[i] = percentage * 100
        _reset(_owner);
        uint256 _tokenCnt = _tokenVote.length;
        uint256 _weight = governanceToken.balanceOf(_owner);
        uint256 _totalVoteWeight = 0;
        uint256 _usedWeight = 0;

        for (uint256 i = 0; i < _tokenCnt; i++) {
            _totalVoteWeight = _totalVoteWeight + _weights[i];
        }

        for (uint256 i = 0; i < _tokenCnt; i++) {
            address _token = _tokenVote[i];
            address _gauge = gauges[_token];
            uint256 _tokenWeight = _weights[i] * _weight / _totalVoteWeight;

            if (_gauge != address(0x0) && gaugeStatus[_token]) {
                _usedWeight = _usedWeight + _tokenWeight;
                totalWeight = totalWeight + _tokenWeight;
                weights[_token] = weights[_token] + _tokenWeight;
                tokenVote[_owner].push(_token);
                votes[_owner][_token] = _tokenWeight;
                // Bribe vote deposit
                IBribe(bribes[_gauge])._deposit(uint256(_tokenWeight), _owner);
            }
        }

        usedWeights[_owner] = _usedWeight;
    }

    // Vote with inSPIRIT on a gauge
    function vote(address[] calldata _tokenVote, uint256[] calldata _weights)
        external
        hasVoted(msg.sender)
    {
        require(_tokenVote.length == _weights.length);
        lastVote[msg.sender] = block.timestamp;
        _vote(msg.sender, _tokenVote, _weights);
    }

    function setAdmin(address _admin) external {
        require(msg.sender == governance, "!gov");
        admin = _admin;
    }

        // Add new token gauge
    function addGaugeForOwner(address _tokenLP, address _token0, address _token1)
        external
        returns (address)
    {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        require(gauges[_tokenLP] == address(0x0), "exists");

        // Deploy Gauge 
        gauges[_tokenLP] = address(
            new VariableGauge( address(rewardToken), address(governanceToken), _tokenLP, address(this))
        );
        _tokens.push(_tokenLP);
        gaugeStatus[_tokenLP] = true;

        // Deploy Bribe
        address _bribe = IBaseV1BribeFactory(bribeFactory).createBribe(
            governance,
            _token0,
            _token1
        );
        bribes[gauges[_tokenLP]] = _bribe;
        emit GaugeAddedByOwner(_tokenLP, _token0, _token1);
        return gauges[_tokenLP];
    }

    // Add new token gauge
    function addGauge(address _tokenLP)
        external
        returns (address)
    {
        require(gauges[_tokenLP] == address(0x0), "exists");
        require(IBaseV1Factory(pairFactory).isPair(_tokenLP), "!_tokenLP");
        require(!IBaseV1Pair(_tokenLP).stable());
        (address _token0, address _token1) = IBaseV1Pair(_tokenLP).tokens();
        require(baseTokens[_token0] && verifiedTokens[_token1] || 
                baseTokens[_token1] && verifiedTokens[_token0], "!verified");
        require(governanceToken.balanceOf(msg.sender) > governanceToken.totalSupply() / 100 ||
            msg.sender == governance || msg.sender == admin, "!supply");
        // Deploy Gauge 
        gauges[_tokenLP] = address(
            new VariableGauge( address(rewardToken), address(governanceToken), _tokenLP, address(this))
        );
        _tokens.push(_tokenLP);
        gaugeStatus[_tokenLP] = true;

        // Deploy Bribe
        address _bribe = IBaseV1BribeFactory(bribeFactory).createBribe(
            governance,
            _token0,
            _token1
        );
        bribes[gauges[_tokenLP]] = _bribe;
        emit GaugeAdded(_tokenLP);
        return gauges[_tokenLP];
    }

    // Deprecate existing gauge
    function deprecateGauge(address _token) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        require(gauges[_token] != address(0x0), "does not exist");
        require(gaugeStatus[_token], "gauge is not active");
        gaugeStatus[_token] = false;
        emit GaugeDeprecated(_token);
    }

    // Bring Deprecated gauge back into use
    function resurrectGauge(address _token) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "!gov or !admin"
        );
        require(gauges[_token] != address(0x0), "does not exist");
        require(!gaugeStatus[_token], "gauge is active");
        gaugeStatus[_token] = true;
        emit GaugeResurrected(_token);
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
    // Change from public to internal, ONLY preDistribute should be able to call
    function collect() internal {
        (uint256 _locked, ) = MASTER.userInfo(pid, address(this));
        MASTER.withdraw(pid, _locked);
        deposit();
    }

    function length() external view returns (uint256) {
        return _tokens.length;
    }

    function preDistribute() external nonReentrant hasDistribute {
        lockedTotalWeight = totalWeight;
        for (uint256 i = 0; i < _tokens.length; i++) {
            lockedWeights[_tokens[i]] = weights[_tokens[i]];
            hasDistributed[_tokens[i]] = false;
        }
        collect();
        lastDistribute = block.timestamp;
        uint256 _balance = rewardToken.balanceOf(address(this));
        lockedBalance = _balance;
        uint256 _inSpiritRewards = 0;
        if (ve) {
            uint256 _lockedSpirit = rewardToken.balanceOf(address(governanceToken));
            uint256 _spiritSupply = rewardToken.totalSupply();
            _inSpiritRewards = _balance * _lockedSpirit / _spiritSupply;

            if (_inSpiritRewards > 0) {
                rewardToken.safeTransfer(feeDistAddr, _inSpiritRewards);
                lockedBalance = rewardToken.balanceOf(address(this));
            }
        }
        locktime = block.timestamp;
        emit PreDistributed(_inSpiritRewards);
    }

    function distribute(uint256 _start, uint256 _end) external nonReentrant {
        require(_start < _end, "bad _start");
        require(_end <= _tokens.length, "bad _end");

        if (lockedBalance > 0 && lockedTotalWeight > 0) {
            for (uint256 i = _start; i < _end; i++) {
                address _token = _tokens[i];
                if (!hasDistributed[_token] && gaugeStatus[_token]) {
                    address _gauge = gauges[_token];
                    uint256 _reward = lockedBalance * lockedWeights[_token] / lockedTotalWeight;
                    if (_reward > 0) {
                        rewardToken.safeApprove(_gauge, 0);
                        rewardToken.safeApprove(_gauge, _reward);
                        VariableGauge( _gauge).notifyRewardAmount(_reward);
                    }
                    hasDistributed[_token] = true;
                }
            }
        }
    }

    // Add claim function for bribes
    function claimBribes(address[] memory _bribes, address _user) external {
        for (uint256 i = 0; i < _bribes.length; i++) {
            IBribe(_bribes[i]).getRewardForOwner(_user);
        }
    }

    // Update fee distributor address
    function updateFeeDistributor(address _feeDistAddr) external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "updateFeeDestributor: permission is denied!"
        );
        feeDistAddr = _feeDistAddr;
    }

    function toggleVE() external {
        require(
            (msg.sender == governance || msg.sender == admin),
            "turnVeOn: permission is denied!"
        );
        ve = !ve;
    }

    event GaugeAdded(address tokenLP);
    event GaugeAddedByOwner(address tokenLP, address token0, address token1);
    event GaugeDeprecated(address tokenLP);
    event GaugeResurrected(address tokenLP);
    event PreDistributed(uint256 spiritRewards);
}