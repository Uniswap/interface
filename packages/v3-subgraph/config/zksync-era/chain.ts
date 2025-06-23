import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x8fda5a7a8dca67bbcdd10f02fa0649a937215422'

export const REFERENCE_TOKEN = '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91'
export const STABLE_TOKEN_POOL = '0x3e3dd517fec2e70eddba2a626422a4ba286e8c38'

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
  '0x5aea5775959fbc2557cc8789bc1bf90a239d9a91', // WETH
  '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4', // USDC.e
  '0x493257fd37edb34451f62edf8d2a0c418852ba4c', // USDT
  '0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4', // USDC
  '0x5a7d6b2f92c77fad6ccabd7ee0624e64907eaf3e', // ZK
]

export const STABLE_COINS: string[] = [
  '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4', // USDC.e
  '0x493257fd37edb34451f62edf8d2a0c418852ba4c', // USDT
  '0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4', // USDC
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
    address: Address.fromString('0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4'),
    symbol: 'USDC.e',
    name: 'Bridged USDC (zkSync)',
    decimals: BigInt.fromI32(6),
  },
]
