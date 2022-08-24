pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

import '../interfaces/ITeleswapV2Pair.sol';

import "./SafeMath.sol";
import "../interfaces/ITeleswapV2Factory.sol";
import "../interfaces/ITeleswapV2Router01.sol";

library TeleswapV2Library {
    using SafeMath for uint;


    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'TeleswapV2Library: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'TeleswapV2Library: ZERO_ADDRESS');
    }

    // calculates the CREATE2 address for a pair without making any external calls
    // todo when code is stable, change pairCodeHash to hardcode.
    function pairFor(bytes32 pairCodeHash, address factory, route memory _route) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(_route.from, _route.to);
        pair = address(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1, _route.stable)),
                pairCodeHash // init code hash
            ))));
    }

    // fetches and sorts the reserves for a pair
    function getReserves(address factory, route memory _route) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(_route.from, _route.to);
        bytes32 codeHash = ITeleswapV2Factory(factory).pairInitCodeHash();
        (uint reserve0, uint reserve1,) = ITeleswapV2Pair(pairFor(codeHash, factory, _route)).getReserves();
        (reserveA, reserveB) = _route.from == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        require(amountA > 0, 'TeleswapV2Library: INSUFFICIENT_AMOUNT');
        require(reserveA > 0 && reserveB > 0, 'TeleswapV2Library: INSUFFICIENT_LIQUIDITY');
        amountB = amountA.mul(reserveB) / reserveA;
    }



    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut, bool stable, uint decimalIn, uint decimalOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'TeleswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'TeleswapV2Library: INSUFFICIENT_LIQUIDITY');
        if (stable) {
            amountIn -= amountIn / 10000;

            uint xy = _k(reserveIn, reserveOut, decimalIn, decimalOut);
            reserveIn = reserveIn * 1e18 / decimalIn;
            reserveOut = reserveOut * 1e18 / decimalOut;
            amountIn = amountIn * 1e18 / decimalIn;
            // x0,xy,y
            amountOut = reserveOut - _get_y(amountIn + reserveIn, xy, reserveOut);
            amountOut = amountOut * decimalOut / 1e18;
        } else {
            uint amountInWithFee = amountIn.mul(997);
            uint numerator = amountInWithFee.mul(reserveOut);
            uint denominator = reserveIn.mul(1000).add(amountInWithFee);
            amountOut = numerator / denominator;
        }

    }


    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut, bool stable, uint decimalIn, uint decimalOut) internal pure returns (uint amountIn) {
        require(amountOut > 0, 'TeleswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'TeleswapV2Library: INSUFFICIENT_LIQUIDITY');
        if (stable) {
            amountOut -= amountOut / 10000;
            uint xy = _k(reserveIn, reserveOut, decimalIn, decimalOut);
            reserveIn = reserveIn * 1e18 / decimalIn;
            reserveOut = reserveOut * 1e18 / decimalOut;
            amountOut = amountOut * 1e18 / decimalOut;
            // y0,xy,x0
            amountIn = reserveIn - _get_y(reserveOut - amountOut, xy, reserveIn);
            return amountIn * decimalIn / 1e18;
        } else {
            uint numerator = reserveIn.mul(amountOut).mul(1000);
            uint denominator = reserveOut.sub(amountOut).mul(997);
            amountIn = (numerator / denominator).add(1);
        }

    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOut(address factory, uint amountIn, route[] memory routes, uint[] memory decimals) internal view returns (uint[] memory amounts) {
        require(routes.length >= 1, 'TeleswapV2Library: INVALID_PATH');
        amounts = new uint[](routes.length + 1);
        amounts[0] = amountIn;
        for (uint i; i < routes.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReserves(factory, routes[i]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut, routes[i].stable, decimals[i], decimals[i + 1]);
        }
    }

    // performs chained getAmountIn calculations on any number of pairs
    function getAmountsIn(address factory, uint amountOut, route[] memory routes, uint[] memory decimals) internal view returns (uint[] memory amounts) {
        require(routes.length >= 1, 'TeleswapV2Library: INVALID_PATH');
        amounts = new uint[](routes.length + 1);
        amounts[amounts.length - 1] = amountOut;
        for (uint i = routes.length - 1; i >= 0; i--) {
            (uint reserveIn, uint reserveOut) = getReserves(factory, routes[i]);
            amounts[i] = getAmountIn(amounts[i+1], reserveIn, reserveOut, routes[i].stable,decimals[i], decimals[i + 1]);
        }
    }


    // reserveIn , reserveOut
    function _k(uint x, uint y, uint decimalsIn, uint decimalsOut) internal pure returns (uint) {
        uint _x = x * 1e18 / decimalsIn;
        uint _y = y * 1e18 / decimalsOut;
        uint _a = (_x * _y) / 1e18;
        uint _b = ((_x * _x) / 1e18 + (_y * _y) / 1e18);
        return _a * _b / 1e18;
        // x3y+y3x >= k
    }

    // x0y^3+x0^3y
    // AB^3+A^3B
    function _f(uint x0, uint y) internal pure returns (uint) {
        return x0 * (y * y / 1e18 * y / 1e18) / 1e18 + (x0 * x0 / 1e18 * x0 / 1e18) * y / 1e18;
    }

    // 3x0y^2+x0^3
    function _d(uint x0, uint y) internal pure returns (uint) {
        return 3 * x0 * (y * y / 1e18) / 1e18 + (x0 * x0 / 1e18 * x0 / 1e18);
    }


    function _get_y(uint x0, uint xy, uint y) internal pure returns (uint) {
        for (uint i = 0; i < 255; i++) {
            uint y_prev = y;
            uint k = _f(x0, y);
            //k =  AB^3+A^3B
            if (k < xy) {
                uint dy = (xy - k) * 1e18 / _d(x0, y);
                y = y + dy;
            } else {
                uint dy = (k - xy) * 1e18 / _d(x0, y);
                y = y - dy;
            }
            if (y > y_prev) {
                if (y - y_prev <= 1) {
                    return y;
                }
            } else {
                if (y_prev - y <= 1) {
                    return y;
                }
            }
        }
        return y;
    }

}
