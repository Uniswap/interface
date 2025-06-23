import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD'

export const REFERENCE_TOKEN = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'
export const STABLE_TOKEN_POOL = '0xfae3f424a0a47706811521e3ee268f00cfb5c45e'

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('1000')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [
  REFERENCE_TOKEN, // WETH
  '0xd586e7f844cea2f87f50152665bcbc2c279d8d70', // dai.e
  '0xba7deebbfc5fa1100fb055a87773e1e99cd3507a', // dai
  '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664', // usdc.e
  '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', // usdc
  '0xc7198437980c041c805a1edcba50c1ce5db95118', // usdt.e
  '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', // usdt
  '0x130966628846bfd36ff31a822705796e8cb8c18d', // mim
]

export const STABLE_COINS: string[] = [
  '0xd586e7f844cea2f87f50152665bcbc2c279d8d70', // dai.e
  '0xba7deebbfc5fa1100fb055a87773e1e99cd3507a', // dai
  '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664', // usdc.e
  '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', // usdc
  '0xc7198437980c041c805a1edcba50c1ce5db95118', // usdt.e
  '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', // usdt
]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
