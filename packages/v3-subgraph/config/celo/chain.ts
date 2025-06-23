import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = Address.fromString('0x1F98431c8aD98523631AE4a59f267346ea31F984')

export const REFERENCE_TOKEN = '0x471ece3750da237f93b8e339c536989b8978a438'
export const STABLE_TOKEN_POOL = '0x079e7a44f42e9cd2442c3b9536244be634e8f888'

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('3600')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with
export const WHITELIST_TOKENS: string[] = [
  '0x471ece3750da237f93b8e339c536989b8978a438', // CELO
  '0x765de816845861e75a25fca122bb6898b8b1282a', // CUSD
  '0xef4229c8c3250c675f21bcefa42f58efbff6002a', // Bridged USDC
  '0xceba9300f2b948710d2653dd7b07f33a8b32118c', // Native USDC
  '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73', // CEUR
  '0xe8537a3d056da446677b9e9d6c5db704eaab4787', // CREAL
  '0x46c9757c5497c5b1f2eb73ae79b6b67d119b0b58', // PACT
  '0x17700282592d6917f6a73d0bf8accf4d578c131e', // MOO
  '0x66803fb87abd4aac3cbb3fad7c3aa01f6f3fb207', // Portal Eth
  '0xbaab46e28388d2779e6e31fd00cf0e5ad95e327b', // WBTC
  '0xd221812de1bd094f35587ee8e174b07b6167d9af', // WETH
  '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e', // USDT
]

export const STABLE_COINS: string[] = [
  '0x765de816845861e75a25fca122bb6898b8b1282a', // CUSD
  '0xef4229c8c3250c675f21bcefa42f58efbff6002a', // Bridged USDC
  '0xceba9300f2b948710d2653dd7b07f33a8b32118c', // Native USDC
  '0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e', // USDT
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
