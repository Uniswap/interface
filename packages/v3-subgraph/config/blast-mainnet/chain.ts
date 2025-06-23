import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x792edAdE80af5fC680d96a2eD80A44247D2Cf6Fd'

export const REFERENCE_TOKEN = '0x4300000000000000000000000000000000000004'
export const STABLE_TOKEN_POOL = '0xf52b4b69123cbcf07798ae8265642793b2e8990c'

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('1')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [
  '0x4300000000000000000000000000000000000004', // WETH
  '0x4300000000000000000000000000000000000003', // USDB
]

export const STABLE_COINS: string[] = [
  '0x4300000000000000000000000000000000000003', // USDB
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
