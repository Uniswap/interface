import JSBI from 'jsbi'
import Web3 from 'web3'
import artifact from '@teleswap/contracts/artifacts/contracts/TeleswapV2Pair.sol/TeleswapV2Pair.json'

// exports for external consumption
export type BigintIsh = JSBI | bigint | string

export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GÖRLI = 5,
  KOVAN = 42,
  OP_GOERLI = 420,
}

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT,
}

export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP,
}

const initCodeHash = Web3.utils.keccak256(artifact.bytecode)

export const FACTORY_ADDRESS = '0xA79247252904A8b81C43274F6C8CdDa998454e96'

export const INIT_CODE_HASH = initCodeHash

export const ROUTER_ADDRESS = '0x9A3beC01c52840985951c05e2e2b2D3CbC2B39E9'

export const WETH_ADDRESS = '0x011449F8DB24D2E54E39Eb5Fd6a18a043fbFd54a'

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

// exports for internal consumption
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const THREE = JSBI.BigInt(3)
export const FIVE = JSBI.BigInt(5)
export const TEN = JSBI.BigInt(10)
export const _100 = JSBI.BigInt(100)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)

export enum SolidityType {
  uint8 = 'uint8',
  uint256 = 'uint256',
}

export const SOLIDITY_TYPE_MAXIMA = {
  [SolidityType.uint8]: JSBI.BigInt('0xff'),
  [SolidityType.uint256]: JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
}
