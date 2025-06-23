import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

export const REFERENCE_TOKEN = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
export const STABLE_TOKEN_POOL = '0xA374094527e1673A86dE625aa59517c5dE346d32'

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
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', // WETH
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', // DA
]

export const STABLE_COINS: string[] = [
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063', // DAI
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
