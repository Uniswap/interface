pragma solidity >=0.6.6;

import './interfaces/ITeleswapV2Factory.sol';
import './TeleswapV2Pair.sol';

contract TeleswapV2Factory is ITeleswapV2Factory {
    address public override feeTo;
    address public override feeToSetter;

    mapping(address => mapping(address => mapping(bool => address))) public override getPair;
    address[] public override allPairs;

    event PairCreated(address indexed token0, address indexed token1, bool stable, address pair, uint);

    //    constructor(address _feeToSetter) public {
    //        feeToSetter = _feeToSetter;
    //    }

    function initialize(address _feeToSetter) public {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() override external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB, bool stable) override external returns (address pair) {
        require(tokenA != tokenB, 'TeleswapV2: IDENTICAL_ADDRESSES');
        // BaseV1: IDENTICAL_ADDRESSES
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'TeleswapV2: ZERO_ADDRESS');
        // BaseV1: ZERO_ADDRESS
        require(getPair[token0][token1][stable] == address(0), 'TeleswapV2: PAIR_EXISTS');
        // BaseV1: PAIR_EXISTS - single check is sufficient
        bytes32 salt = keccak256(abi.encodePacked(token0, token1, stable));
        // notice salt includes stable as well, 3 parameters
        bytes memory bytecode = type(TeleswapV2Pair).creationCode;
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        // init pair
        TeleswapV2Pair(pair).initialize(token0, token1, stable);

        // update factory state
        getPair[token0][token1][stable] = pair;
        getPair[token1][token0][stable] = pair;
        // populate mapping in the reverse direction
        allPairs.push(pair);

        emit PairCreated(token0, token1, stable, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) override external {
        require(msg.sender == feeToSetter, 'TeleswapV2: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) override external {
        require(msg.sender == feeToSetter, 'TeleswapV2: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }

    /**
     * For solving the CREATE2 problem in a easier way
     */
    function pairInitCodeHash() override public pure returns (bytes32) {
        return keccak256(type(TeleswapV2Pair).creationCode);
    }
}
