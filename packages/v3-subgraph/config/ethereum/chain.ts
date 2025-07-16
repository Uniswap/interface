import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

export const REFERENCE_TOKEN = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
export const STABLE_TOKEN_POOL = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8'

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
  REFERENCE_TOKEN, // WETH
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
  '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
  '0x86fadb80d8d2cff3c3680819e4da99c10232ba0f', // EBASE
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
  '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
  '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', // SNX
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', // YFI
  '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
  '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8', // yCurv
  '0x956f47f50a910163d8bf957cf5846d573e7f87ca', // FEI
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
  '0xfe2e637202056d30016725477c5da089ab0a043a', // sETH2
]

export const STABLE_COINS: string[] = [
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0x0000000000085d4780b73119b644ae5ecd22b376',
  '0x956f47f50a910163d8bf957cf5846d573e7f87ca',
  '0x4dd28568d05f09b02220b09c2cb307bfd837cb95',
]

export const SKIP_POOLS: string[] = ['0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248']

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = [
  {
    address: Address.fromString('0xe0b7927c4af23765cb51314a0e0521a9645f0e2a'),
    symbol: 'DGD',
    name: 'DGD',
    decimals: BigInt.fromI32(9),
  },
  {
    address: Address.fromString('0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'),
    symbol: 'AAVE',
    name: 'Aave Token',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xeb9951021698b42e4399f9cbb6267aa35f82d59d'),
    symbol: 'LIF',
    name: 'Lif',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xbdeb4b83251fb146687fa19d1c660f99411eefe3'),
    symbol: 'SVD',
    name: 'savedroid',
    decimals: BigInt.fromI32(18),
  },
  {
    address: Address.fromString('0xbb9bc244d798123fde783fcc1c72d3bb8c189413'),
    symbol: 'TheDAO',
    name: 'TheDAO',
    decimals: BigInt.fromI32(16),
  },
  {
    address: Address.fromString('0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2'),
    symbol: 'HPB',
    name: 'HPBCoin',
    decimals: BigInt.fromI32(18),
  },
]
