pragma solidity =0.6.6;
pragma experimental ABIEncoderV2;

import './interfaces/ITeleswapV2Factory.sol';
import '@uniswap/lib/contracts/libraries/TransferHelper.sol';

import './interfaces/ITeleswapV2Router02.sol';
import './libraries/TeleswapV2Library.sol';
import './libraries/SafeMath.sol';
import './interfaces/IERC20.sol';
import './interfaces/IWETH.sol';

contract TeleswapV2Router02 is ITeleswapV2Router02 {
    using SafeMath for uint;

    address public override factory;
    address public override WETH;
    bytes32  pairCodeHash;




    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'TeleswapV2Router: EXPIRED');
        _;
    }

    //    constructor(address _factory, address _WETH) public {
    //        factory = _factory;
    //        WETH = _WETH;
    //        pairCodeHash = ITeleswapV2Factory(_factory).pairInitCodeHash();
    //    }

    function initialize(address _factory, address _WETH) public override {
        factory = _factory;
        WETH = _WETH;
        pairCodeHash = ITeleswapV2Factory(_factory).pairInitCodeHash();
    }

    receive() external payable {
        assert(msg.sender == WETH);
        // only accept ETH via fallback from the WETH contract
    }

    // **** ADD LIQUIDITY ****
    function _addLiquidity(
        route memory _route,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal virtual returns (uint amountA, uint amountB) {
        // create the pair if it doesn't exist yet
        address _pair = ITeleswapV2Factory(factory).getPair(_route.from, _route.to, _route.stable);
        if (_pair == address(0)) {
            _pair = ITeleswapV2Factory(factory).createPair(_route.from, _route.to, _route.stable);
        }
        (uint reserveA, uint reserveB) = TeleswapV2Library.getReserves(factory, _route);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = TeleswapV2Library.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, 'TeleswapV2Router: INSUFFICIENT_B_AMOUNT');
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = TeleswapV2Library.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, 'TeleswapV2Router: INSUFFICIENT_A_AMOUNT');
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }
    //todo: stack too deep
    function addLiquidity(
        route calldata _route,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(_route, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = TeleswapV2Library.pairFor(pairCodeHash, factory, _route);
        TransferHelper.safeTransferFrom(_route.from, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(_route.to, msg.sender, pair, amountB);
        liquidity = ITeleswapV2Pair(pair).mint(to);
    }

    function addLiquidityETH(
        route calldata _route,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external virtual override payable ensure(deadline) returns (uint amountToken, uint amountETH, uint liquidity) {
        (amountToken, amountETH) = _addLiquidity(
            _route,
            amountTokenDesired,
            msg.value,
            amountTokenMin,
            amountETHMin
        );
        address pair = TeleswapV2Library.pairFor(pairCodeHash, factory, _route);
        TransferHelper.safeTransferFrom(_route.from, msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value : amountETH}();
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = ITeleswapV2Pair(pair).mint(to);
        // refund dust eth, if any
        if (msg.value > amountETH) TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
    }

    // **** REMOVE LIQUIDITY ****
    function removeLiquidity(
        route memory _route,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = TeleswapV2Library.pairFor(pairCodeHash, factory, _route);
        ITeleswapV2Pair(pair).transferFrom(msg.sender, pair, liquidity);
        // send liquidity to pair
        (uint amount0, uint amount1) = ITeleswapV2Pair(pair).burn(to);
        (address token0,) = TeleswapV2Library.sortTokens(_route.from, _route.to);
        (amountA, amountB) = _route.from == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, 'TeleswapV2Router: INSUFFICIENT_A_AMOUNT');
        require(amountB >= amountBMin, 'TeleswapV2Router: INSUFFICIENT_B_AMOUNT');
    }

    function removeLiquidityETH(
        route calldata _route,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint amountToken, uint amountETH) {
        (amountToken, amountETH) = removeLiquidity(
            _route,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(_route.from, to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }

    function removeLiquidityWithPermit(
        route calldata _route,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, Sig calldata sig
    ) external virtual override returns (uint amountA, uint amountB) {
        address pair = TeleswapV2Library.pairFor(pairCodeHash, factory, _route);
        uint value = approveMax ? uint(- 1) : liquidity;
        ITeleswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, sig.v, sig.r, sig.s);
        (amountA, amountB) = removeLiquidity(_route, liquidity, amountAMin, amountBMin, to, deadline);
    }

    function removeLiquidityETHWithPermit(
        route calldata _route,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, Sig calldata sig
    ) external virtual override returns (uint amountToken, uint amountETH) {
        {
            address pair = TeleswapV2Library.pairFor(pairCodeHash, factory, _route);
            uint value = approveMax ? uint(- 1) : liquidity;
            ITeleswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, sig.v, sig.r, sig.s);
        }

        {
            (amountToken, amountETH) = this.removeLiquidityETH(_route, liquidity, amountTokenMin, amountETHMin, to, deadline);
        }

    }

    // **** REMOVE LIQUIDITY (supporting fee-on-transfer tokens) ****
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        route memory _route,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) public virtual override ensure(deadline) returns (uint amountETH) {
        (, amountETH) = removeLiquidity(
            _route,
            liquidity,
            amountTokenMin,
            amountETHMin,
            address(this),
            deadline
        );
        TransferHelper.safeTransfer(_route.from, to, IERC20(_route.from).balanceOf(address(this)));
        IWETH(WETH).withdraw(amountETH);
        TransferHelper.safeTransferETH(to, amountETH);
    }

    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        route calldata _route,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, Sig calldata sig
    ) external virtual override returns (uint amountETH) {
        address pair = TeleswapV2Library.pairFor(pairCodeHash, factory, _route);
        uint value = approveMax ? uint(- 1) : liquidity;
        ITeleswapV2Pair(pair).permit(msg.sender, address(this), value, deadline, sig.v, sig.r, sig.s);
        amountETH = removeLiquidityETHSupportingFeeOnTransferTokens(
            _route, liquidity, amountTokenMin, amountETHMin, to, deadline
        );
    }

    // **** SWAP ****
    // requires the initial amount to have already been sent to the first pair
    function _swap(uint[] memory amounts, route[] memory routes, address _to) internal virtual {
        for (uint i; i <= routes.length - 1; i++) {
            (address input, address output) = (routes[i].from, routes[i].to);
            (address token0,) = TeleswapV2Library.sortTokens(input, output);
            uint amountOut = amounts[i + 1];
            (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOut) : (amountOut, uint(0));
            address to = i < routes.length - 1 ? TeleswapV2Library.pairFor(pairCodeHash, factory, routes[i + 1]) : _to;
            ITeleswapV2Pair(TeleswapV2Library.pairFor(pairCodeHash, factory, routes[i])).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        route[] calldata routes,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        amounts = getAmountsOut(amountIn, routes);
        require(amounts[amounts.length - 1] >= amountOutMin, 'TeleswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            routes[0].from, msg.sender, TeleswapV2Library.pairFor(pairCodeHash, factory, routes[0]), amountIn);
        _swap(amounts, routes, to);
    }

    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        route[] calldata routes,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) returns (uint[] memory amounts) {
        amounts = getAmountsIn(amountOut, routes);
        require(amounts[0] <= amountInMax, 'TeleswapV2Router: EXCESSIVE_INPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            routes[0].from, msg.sender, TeleswapV2Library.pairFor(pairCodeHash, factory, routes[0]), amounts[0]
        );
        _swap(amounts, routes, to);
    }

    function swapExactETHForTokens(uint amountOutMin, route[] calldata routes, address to, uint deadline)
    external
    virtual
    override
    payable
    ensure(deadline)
    returns (uint[] memory amounts)
    {
        require(routes[0].from == WETH, 'TeleswapV2Router: INVALID_PATH');
        amounts = getAmountsOut(msg.value, routes);
        require(amounts[amounts.length - 1] >= amountOutMin, 'TeleswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        IWETH(WETH).deposit{value : amounts[0]}();
        assert(IWETH(WETH).transfer(TeleswapV2Library.pairFor(pairCodeHash, factory, routes[0]), amounts[0]));
        _swap(amounts, routes, to);
    }

    function swapTokensForExactETH(uint amountOut, uint amountInMax, route[] calldata routes, address to, uint deadline)
    external
    virtual
    override
    ensure(deadline)
    returns (uint[] memory amounts)
    {
        require(routes[routes.length - 1].to == WETH, 'TeleswapV2Router: INVALID_PATH');
        amounts = getAmountsIn(amountOut, routes);
        require(amounts[0] <= amountInMax, 'TeleswapV2Router: EXCESSIVE_INPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            routes[0].from, msg.sender, TeleswapV2Library.pairFor(pairCodeHash, factory, routes[0]), amounts[0]
        );
        _swap(amounts, routes, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }

    function swapExactTokensForETH(uint amountIn, uint amountOutMin, route[] calldata routes, address to, uint deadline)
    external
    virtual
    override
    ensure(deadline)
    returns (uint[] memory amounts)
    {
        require(routes[routes.length - 1].to == WETH, 'TeleswapV2Router: INVALID_PATH');
        amounts = getAmountsOut(amountIn, routes);
        require(amounts[amounts.length - 1] >= amountOutMin, 'TeleswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        TransferHelper.safeTransferFrom(
            routes[0].from, msg.sender, TeleswapV2Library.pairFor(pairCodeHash, factory, routes[0]), amounts[0]
        );
        _swap(amounts, routes, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        TransferHelper.safeTransferETH(to, amounts[amounts.length - 1]);
    }

    function swapETHForExactTokens(uint amountOut, route[] calldata routes, address to, uint deadline)
    external
    virtual
    override
    payable
    ensure(deadline)
    returns (uint[] memory amounts)
    {
        require(routes[0].from == WETH, 'TeleswapV2Router: INVALID_PATH');
        amounts = getAmountsIn(amountOut, routes);
        require(amounts[0] <= msg.value, 'TeleswapV2Router: EXCESSIVE_INPUT_AMOUNT');
        IWETH(WETH).deposit{value : amounts[0]}();
        assert(IWETH(WETH).transfer(TeleswapV2Library.pairFor(pairCodeHash, factory, routes[0]), amounts[0]));
        _swap(amounts, routes, to);
        // refund dust eth, if any
        if (msg.value > amounts[0]) TransferHelper.safeTransferETH(msg.sender, msg.value - amounts[0]);
    }

    // **** SWAP (supporting fee-on-transfer tokens) ****
    // requires the initial amount to have already been sent to the first pair
    function _swapSupportingFeeOnTransferTokens(route[] memory _routes, address _to) internal virtual {
        for (uint i; i < _routes.length; i++) {
            (address token0,) = TeleswapV2Library.sortTokens(_routes[i].from, _routes[i].to);
            ITeleswapV2Pair pair = ITeleswapV2Pair(TeleswapV2Library.pairFor(pairCodeHash, factory, _routes[i]));
            uint amountInput;
            uint amountOutput;
            uint reserveInput;
            uint reserveOutput;
            {// scope to avoid stack too deep errors
                (uint reserve0, uint reserve1,) = pair.getReserves();
                (reserveInput, reserveOutput) = _routes[i].from == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
                amountInput = IERC20(_routes[i].from).balanceOf(address(pair)).sub(reserveInput);
            }
            {
                uint decimalIn = IERC20(_routes[i].from).decimals();
                uint decimalOut = IERC20(_routes[i].to).decimals();
                amountOutput = getAmountOut(amountInput, reserveInput, reserveOutput, _routes[i].stable, decimalIn, decimalOut);
            }
            (uint amount0Out, uint amount1Out) = _routes[i].from == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));
            address to = i < _routes.length - 1 ? TeleswapV2Library.pairFor(pairCodeHash, factory, _routes[i + 1]) : _to;
            pair.swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        route[] calldata routes,
        address to,
        uint deadline
    ) external virtual override ensure(deadline) {
        TransferHelper.safeTransferFrom(
            routes[0].from, msg.sender, TeleswapV2Library.pairFor(pairCodeHash, factory, routes[0]), amountIn
        );
        uint balanceBefore = IERC20(routes[routes.length - 1].to).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(routes, to);
        require(
            IERC20(routes[routes.length - 1].to).balanceOf(to).sub(balanceBefore) >= amountOutMin,
            'TeleswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
        );
    }

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        route[] calldata routes,
        address to,
        uint deadline
    )
    external
    virtual
    override
    payable
    ensure(deadline)
    {
        require(routes[0].from == WETH, 'TeleswapV2Router: INVALID_PATH');
        uint amountIn = msg.value;
        IWETH(WETH).deposit{value : amountIn}();
        assert(IWETH(WETH).transfer(TeleswapV2Library.pairFor(pairCodeHash, factory, routes[0]), amountIn));
        uint balanceBefore = IERC20(routes[routes.length - 1].to).balanceOf(to);
        _swapSupportingFeeOnTransferTokens(routes, to);
        require(
            IERC20(routes[routes.length - 1].to).balanceOf(to).sub(balanceBefore) >= amountOutMin,
            'TeleswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT'
        );
    }

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        route[] calldata routes,
        address to,
        uint deadline
    )
    external
    virtual
    override
    ensure(deadline)
    {
        require(routes[routes.length - 1].to == WETH, 'TeleswapV2Router: INVALID_PATH');
        TransferHelper.safeTransferFrom(
            routes[0].from, msg.sender, TeleswapV2Library.pairFor(pairCodeHash, factory, routes[0]), amountIn
        );
        _swapSupportingFeeOnTransferTokens(routes, address(this));
        uint amountOut = IERC20(WETH).balanceOf(address(this));
        require(amountOut >= amountOutMin, 'TeleswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT');
        IWETH(WETH).withdraw(amountOut);
        TransferHelper.safeTransferETH(to, amountOut);
    }

    // **** LIBRARY FUNCTIONS ****
    function quote(uint amountA, uint reserveA, uint reserveB) public pure virtual override returns (uint amountB) {
        return TeleswapV2Library.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut, bool stable, uint decimalIn, uint decimalOut)
    public
    pure
    virtual
    override
    returns (uint amountOut)
    {
        return TeleswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut, stable, decimalIn, decimalOut);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut, bool stable, uint decimalIn, uint decimalOut)
    public
    pure
    virtual
    override
    returns (uint amountIn)
    {
        return TeleswapV2Library.getAmountIn(amountOut, reserveIn, reserveOut, stable, decimalIn, decimalOut);
    }

    function getAmountsOut(uint amountIn, route[] memory _routes)
    public
    view
    virtual
    override
    returns (uint[] memory amounts)
    {
        uint[] memory decimals = new uint[](_routes.length + 1);
        // query all decimals
        decimals[0] = IERC20(_routes[0].from).decimals();
        for (uint i; i < _routes.length; i++) {
            decimals[i + 1] = IERC20(_routes[i].to).decimals();
        }
        return TeleswapV2Library.getAmountsOut(factory, amountIn, _routes, decimals);
    }

    function getAmountsIn(uint amountOut, route[] memory _routes)
    public
    view
    virtual
    override
    returns (uint[] memory amounts)
    {
        uint[] memory decimals = new uint[](_routes.length + 1);
        // query all decimals
        decimals[0] = IERC20(_routes[0].from).decimals();
        for (uint i; i < _routes.length; i++) {
            decimals[i + 1] = IERC20(_routes[i].to).decimals();
        }

        return TeleswapV2Library.getAmountsIn(factory, amountOut, _routes, decimals);
    }
}
