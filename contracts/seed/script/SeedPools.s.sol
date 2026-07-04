// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "../src/vendor/Script.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {IERC20, IWETH} from "../src/interfaces/IERC20.sol";
import {IUniswapV2Factory} from "../src/interfaces/IUniswapV2Factory.sol";
import {IUniswapV2Router02} from "../src/interfaces/IUniswapV2Router02.sol";
import {IUniswapV3Factory} from "../src/interfaces/IUniswapV3Factory.sol";
import {INonfungiblePositionManager} from "../src/interfaces/INonfungiblePositionManager.sol";
import {FullMath} from "../src/libraries/FullMath.sol";
import {TickMath} from "../src/libraries/TickMath.sol";

/// @title SeedPools
/// @notice Creates + seeds ONE liquidity pool (v2 pair or v3 concentrated position)
///         per invocation, driven entirely by environment variables that
///         `scripts/seed.sh` fills in from the JSON config + the chain's deployment
///         record. The orchestrator loops over the config's pools and invokes this
///         script once per pool.
///
/// Design notes:
///  - Token addresses are resolved AT RUNTIME (a token may be "MINT" => deploy a
///    fresh MockERC20, or "WETH" => the chain's wrapped-native). Sorting for v3
///    (token0 < token1) therefore has to happen here, after any MINT deploy.
///  - sqrtPriceX96 is computed for real from the human price + token decimals
///    (see _sqrtPriceX96). A wrong value bricks the pool, so this is exact math.
///  - Ticks are always snapped to the fee tier's tickSpacing.
contract SeedPools is Script {
    uint256 internal constant ONE_E18 = 1e18;

    struct Inputs {
        address recipient; // deployer EOA: LP recipient, mint target, balance owner
        address weth; // chain wrapped-native (from deployment JSON)
        address v2Factory;
        address v2Router;
        address v3Factory;
        address npm; // NonfungiblePositionManager
        // tokens in the A/B order given by config (resolved to real addresses)
        address tokenA;
        uint8 decA;
        uint256 rawA;
        address tokenB;
        uint8 decB;
        uint256 rawB;
        uint24 fee; // v3 only
        uint256 priceE18; // priceAperB * 1e18  (units of B per 1 A, human)
        bool wide; // v3 range mode
        int24 rangeTicks; // v3 concentrated half-width, in tickSpacings
    }

    function run() external {
        Inputs memory i = _readAddresses();
        bool isV2 = _eq(vm.envString("SEED_PROTOCOL"), "v2");

        console2.log("=== HookSwap pool seeder ===");
        console2.log("protocol:", vm.envString("SEED_PROTOCOL"));
        console2.log("recipient:", i.recipient);

        vm.startBroadcast();

        _resolveToken(i, true); // A
        _resolveToken(i, false); // B

        if (isV2) {
            _seedV2(i);
        } else {
            _seedV3(i);
        }

        vm.stopBroadcast();
        console2.log("=== done ===");
    }

    // -----------------------------------------------------------------------
    // Input reading
    // -----------------------------------------------------------------------

    function _readAddresses() internal view returns (Inputs memory i) {
        string memory dj = vm.readFile(vm.envString("DEPLOYMENT_JSON"));
        i.recipient = vm.parseAddress(vm.envString("SEED_RECIPIENT"));
        i.weth = vm.parseJsonAddress(dj, ".weth9");
        i.v2Factory = vm.parseJsonAddress(dj, ".v2Factory");
        i.v2Router = vm.parseJsonAddress(dj, ".v2Router02");
        i.v3Factory = vm.parseJsonAddress(dj, ".v3Factory");
        i.npm = vm.parseJsonAddress(dj, ".nonfungiblePositionManager");

        i.decA = uint8(vm.envUint("SEED_TOKENA_DECIMALS"));
        i.decB = uint8(vm.envUint("SEED_TOKENB_DECIMALS"));
        i.rawA = _rawFromE18(vm.envUint("SEED_AMOUNTA_E18"), i.decA);
        i.rawB = _rawFromE18(vm.envUint("SEED_AMOUNTB_E18"), i.decB);
        i.fee = uint24(vm.envOr("SEED_FEE", uint256(3000)));
        i.priceE18 = vm.envUint("SEED_PRICE_E18");
        i.wide = _eq(vm.envOr("SEED_RANGE", string("concentrated")), "wide");
        i.rangeTicks = int24(int256(vm.envOr("SEED_RANGE_TICKS", uint256(50))));
    }

    /// @dev Resolve token A or B: address literal, "WETH" (chain wrapped-native),
    ///      or "MINT" (deploy a fresh MockERC20 and mint a big supply to recipient).
    function _resolveToken(Inputs memory i, bool isA) internal {
        string memory sel = isA ? "SEED_TOKENA" : "SEED_TOKENB";
        string memory raw = vm.envString(sel);
        uint8 dec = isA ? i.decA : i.decB;
        address token;

        if (_eq(raw, "MINT")) {
            string memory name = vm.envString(string.concat(sel, "_NAME"));
            string memory sym = vm.envString(string.concat(sel, "_SYMBOL"));
            MockERC20 t = new MockERC20(name, sym, dec);
            // default mint: 1e12 whole tokens (plenty for demo seeding); override via *_MINT_E18
            uint256 mintE18 = vm.envOr(string.concat(sel, "_MINT_E18"), uint256(1e12) * ONE_E18);
            t.mint(i.recipient, _rawFromE18(mintE18, dec));
            token = address(t);
            console2.log(string.concat("minted MockERC20 ", sym), token);
        } else if (_eq(raw, "WETH")) {
            token = i.weth;
        } else {
            token = vm.parseAddress(raw);
        }

        if (isA) i.tokenA = token;
        else i.tokenB = token;
    }

    // -----------------------------------------------------------------------
    // v2
    // -----------------------------------------------------------------------

    function _seedV2(Inputs memory i) internal {
        IUniswapV2Factory f = IUniswapV2Factory(i.v2Factory);
        address pair = f.getPair(i.tokenA, i.tokenB);
        if (pair == address(0)) {
            pair = f.createPair(i.tokenA, i.tokenB);
            console2.log("created v2 pair:", pair);
        } else {
            console2.log("v2 pair exists:", pair);
        }

        _prepare(i, i.tokenA, i.v2Router, i.rawA);
        _prepare(i, i.tokenB, i.v2Router, i.rawB);

        // amountMin = 0 (demo). The deposit RATIO sets the initial v2 price, so keep
        // amountA/amountB in the intended price proportion in the config.
        IUniswapV2Router02(i.v2Router).addLiquidity(
            i.tokenA, i.tokenB, i.rawA, i.rawB, 0, 0, i.recipient, block.timestamp + 3600
        );
        console2.log("v2 addLiquidity ok. amountA(raw):", i.rawA);
        console2.log("v2 addLiquidity ok. amountB(raw):", i.rawB);
    }

    // -----------------------------------------------------------------------
    // v3
    // -----------------------------------------------------------------------

    function _seedV3(Inputs memory i) internal {
        int24 spacing = _tickSpacing(i.fee);

        // Sort to (token0, token1) with token0 < token1 by address.
        bool aIs0 = i.tokenA < i.tokenB;
        (address token0, address token1) = aIs0 ? (i.tokenA, i.tokenB) : (i.tokenB, i.tokenA);
        (uint8 dec0, uint8 dec1) = aIs0 ? (i.decA, i.decB) : (i.decB, i.decA);
        (uint256 amount0, uint256 amount1) = aIs0 ? (i.rawA, i.rawB) : (i.rawB, i.rawA);

        uint160 sqrtPriceX96 = _sqrtPriceX96(i.priceE18, aIs0, dec0, dec1);
        console2.log("v3 sqrtPriceX96:", uint256(sqrtPriceX96));

        address pool = INonfungiblePositionManager(i.npm).createAndInitializePoolIfNecessary(
            token0, token1, i.fee, sqrtPriceX96
        );
        console2.log("v3 pool:", pool);

        (int24 tickLower, int24 tickUpper) = _ticks(sqrtPriceX96, spacing, i.wide, i.rangeTicks);
        console2.log("v3 tickLower:", int256(tickLower));
        console2.log("v3 tickUpper:", int256(tickUpper));

        _prepare(i, token0, i.npm, amount0);
        _prepare(i, token1, i.npm, amount1);

        INonfungiblePositionManager.MintParams memory p = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: i.fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0,
            amount1Desired: amount1,
            amount0Min: 0,
            amount1Min: 0,
            recipient: i.recipient,
            deadline: block.timestamp + 3600
        });
        (uint256 tokenId,, uint256 used0, uint256 used1) = INonfungiblePositionManager(i.npm).mint(p);
        console2.log("v3 mint tokenId:", tokenId);
        console2.log("v3 used amount0:", used0);
        console2.log("v3 used amount1:", used1);
    }

    // -----------------------------------------------------------------------
    // Price / tick math
    // -----------------------------------------------------------------------

    /// @notice sqrtPriceX96 = sqrt(price_raw) * 2^96, where price_raw is the price of
    ///         token1 in units of token0, expressed in each token's BASE units.
    /// @param priceE18 human price "units of B per 1 A", scaled by 1e18.
    /// @param aIs0 whether config token A sorted to token0.
    /// @param dec0 decimals of token0
    /// @param dec1 decimals of token1
    function _sqrtPriceX96(uint256 priceE18, bool aIs0, uint8 dec0, uint8 dec1)
        internal
        pure
        returns (uint160)
    {
        require(priceE18 > 0, "price=0");
        // priceAperB (B per A, human) = priceE18 / 1e18.
        // We need price_token1_per_token0 (human): if A==token0 then token1==B so it's
        // (B per A) = priceE18/1e18; if B==token0 then token1==A so it's (A per B) = inverse.
        // human price = num/den:
        uint256 num;
        uint256 den;
        if (aIs0) {
            num = priceE18; // token1(=B) per token0(=A)
            den = ONE_E18;
        } else {
            num = ONE_E18; // token1(=A) per token0(=B) = 1 / (B per A)
            den = priceE18;
        }
        // price_raw = human * 10^dec1 / 10^dec0 = (num * 10^dec1) / (den * 10^dec0)
        uint256 numerator = num * (uint256(10) ** dec1);
        uint256 denominator = den * (uint256(10) ** dec0);
        // ratioX192 = price_raw << 192 = mulDiv(numerator, 2^192, denominator)
        uint256 ratioX192 = FullMath.mulDiv(numerator, uint256(1) << 192, denominator);
        uint256 s = FullMath.sqrt(ratioX192);
        require(s >= TickMath.MIN_SQRT_RATIO && s < TickMath.MAX_SQRT_RATIO, "sqrtPrice out of range");
        return uint160(s);
    }

    function _ticks(uint160 sqrtPriceX96, int24 spacing, bool wide, int24 rangeTicks)
        internal
        pure
        returns (int24 tickLower, int24 tickUpper)
    {
        int24 minUsable = (TickMath.MIN_TICK / spacing) * spacing;
        int24 maxUsable = (TickMath.MAX_TICK / spacing) * spacing;
        if (wide) {
            return (minUsable, maxUsable);
        }
        int24 current = TickMath.getTickAtSqrtRatio(sqrtPriceX96);
        int24 base = _nearestUsable(current, spacing);
        int24 half = rangeTicks * spacing;
        tickLower = base - half;
        tickUpper = base + half;
        if (tickLower < minUsable) tickLower = minUsable;
        if (tickUpper > maxUsable) tickUpper = maxUsable;
        require(tickLower < tickUpper, "empty tick range");
    }

    function _nearestUsable(int24 tick, int24 spacing) internal pure returns (int24) {
        int24 q = tick / spacing;
        int24 r = tick % spacing;
        if (r != 0) {
            if (tick < 0) {
                if (-r * 2 >= spacing) q -= 1;
            } else {
                if (r * 2 >= spacing) q += 1;
            }
        }
        return q * spacing;
    }

    function _tickSpacing(uint24 fee) internal pure returns (int24) {
        if (fee == 100) return 1;
        if (fee == 500) return 10;
        if (fee == 3000) return 60;
        if (fee == 10000) return 200;
        revert("unsupported fee tier (use 100/500/3000/10000)");
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /// @dev Ensure the deployer holds `rawAmount` of `token` (auto-wrapping native
    ///      into WETH when the token is the chain's wrapped-native and it's short),
    ///      then approve `spender` for the max.
    function _prepare(Inputs memory i, address token, address spender, uint256 rawAmount) internal {
        uint256 bal = IERC20(token).balanceOf(i.recipient);
        if (token == i.weth && bal < rawAmount) {
            uint256 short = rawAmount - bal;
            require(i.recipient.balance >= short, "insufficient native to wrap into WETH");
            IWETH(i.weth).deposit{value: short}();
            bal = IERC20(token).balanceOf(i.recipient);
        }
        require(bal >= rawAmount, "insufficient token balance to seed pool");
        IERC20(token).approve(spender, type(uint256).max);
    }

    function _rawFromE18(uint256 amountE18, uint8 dec) internal pure returns (uint256) {
        // raw = amountE18 * 10^dec / 1e18
        return FullMath.mulDiv(amountE18, uint256(10) ** dec, ONE_E18);
    }

    function _eq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
