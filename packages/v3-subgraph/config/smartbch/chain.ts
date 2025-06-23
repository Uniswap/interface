import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = Address.fromString('0xC2136A0cF8453FEA06f95769BB851E44b9712070')

export const REFERENCE_TOKEN = '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04'
export const STABLE_TOKEN_POOL = '0x24a1dd0dd045c14fcd70258b46550f2e3b5b8939'

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('20000')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [
  '0x73BE9c8Edf5e951c9a0762EA2b1DE8c8F38B5e91', // TANGO
  '0x7b2B3C5308ab5b2a1d9a94d20D35CCDf61e05b72', // flexUSD
  '0xBc9bD8DDe6C5a8e1CBE293356E02f5984693b195', // bcBCH
  '0x3743eC0673453E5009310C727Ba4eaF7b3a1cc04' // wBCH
]

export const STABLE_COINS: string[] = [
  '0x7b2B3C5308ab5b2a1d9a94d20D35CCDf61e05b72' // flexUSD
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
