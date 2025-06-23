import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

export const REFERENCE_TOKEN = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
export const STABLE_TOKEN_POOL = '0x17c14d2c404d167802b16c450d3c99f88f2c4f4d'

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('20')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
export const WHITELIST_TOKENS: string[] = [
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', // WETH
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDC
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
]

export const STABLE_COINS: string[] = [
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // USDC
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', // DAI
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', // USDT
]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString(REFERENCE_TOKEN),
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xff970a61a04b1ca14834a43f5de4533ebddb5cc8'),
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: BigInt.fromI32(6),
  },
]
