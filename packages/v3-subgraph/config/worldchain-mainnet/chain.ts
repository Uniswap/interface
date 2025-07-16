import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x7a5028BDa40e7B173C278C5342087826455ea25a'

export const REFERENCE_TOKEN = '0x4200000000000000000000000000000000000006'
export const STABLE_TOKEN_POOL = '0x5f835420502a7702de50cd0e78d8aa3608b2137e'

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
  '0x4200000000000000000000000000000000000006', // WETH
  '0x79a02482a880bce3f13e09da970dc34db4cd24d1', // USDC.e
  '0x03c7054bcb39f7b2e5b2c7acb37583e32d70cfa3', // WBTC
  '0x2cfc85d8e48f8eab294be644d9e25c3030863003', // WLD
  '0x859dbe24b90c9f2f7742083d3cf59ca41f55be5d', // sDAI
]

export const STABLE_COINS: string[] = [
  '0x79a02482a880bce3f13e09da970dc34db4cd24d1', // USDC.e
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
