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



export const INIT_CODE_HASH = initCodeHash

export const FACTORY_ADDRESS = '0xc58E0590015aeF1b28B69213808Adf2e21A4dAe5'
export const ROUTER_ADDRESS = '0x971a96fe8597fd7a042b5894600ba5e20EBB39ee'
export const WETH_ADDRESS = '0xf68f4839407524D09200D733e2c201421DA3D9CE'
export const USDT_ADDRESS = '0x70aBC17e870366C336A5DAd05061828fEff76fF5'
export const USDC_ADDRESS = '0x56c822f91C1DC40ce32Ae6109C7cc1D18eD08ECE'
export const DAI_ADDRESS = '0x04df1ac7cdD21c065Dcbb73AF9933EECc0F6A59B'

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
