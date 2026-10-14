import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import type { PoolData } from '~/data/pools/poolData'
import type { PoolStat } from '~/types/explore'

export const validParams = { poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', chainName: 'ethereum' }

const validPoolToken0 = {
  id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  symbol: 'USDC',
  name: 'USD Coin',
  derivedETH: '0.0006240873011635544626425964678706127',
  __typename: 'Token',
  chain: 'ETHEREUM',
  decimals: 6,
  project: {
    id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    tokens: [],
    logo: {
      id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      url: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    },
  },
}

export const validBEPoolToken0 = validPoolToken0
export const validRestPoolToken0 = validPoolToken0 as unknown as PoolStat['token0']

export const validUSDCCurrency = {
  isNative: false,
  isToken: true,
  name: 'USDCoin',
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
  chainId: 1,
  logoURI:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  _checksummedAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  _tags: null,
  wrapped: validBEPoolToken0,
} as unknown as Currency

const validPoolToken1 = {
  symbol: 'WETH',
  name: 'Wrapped Ether',
  derivedETH: '1',
  __typename: 'Token',
  address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  chain: 'ETHEREUM',
  decimals: 18,
  project: {
    id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    tokens: [],
    logo: {
      id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      url: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    },
  },
}

export const validBEPoolToken1 = validPoolToken1
export const validRestPoolToken1 = validPoolToken1 as unknown as PoolStat['token0']

// Parsed v2-native ParsedToken fixtures — what PoolData carries post-GraphQL.
export const validParsedPoolToken0: ParsedToken = {
  chainId: UniverseChainId.Mainnet,
  address: validPoolToken0.address,
  symbol: validPoolToken0.symbol,
  name: validPoolToken0.name,
  decimals: validPoolToken0.decimals,
  logoUrl: validPoolToken0.project.logo.url,
}

export const validParsedPoolToken1: ParsedToken = {
  chainId: UniverseChainId.Mainnet,
  address: validPoolToken1.address,
  symbol: validPoolToken1.symbol,
  name: validPoolToken1.name,
  decimals: validPoolToken1.decimals,
  logoUrl: validPoolToken1.project.logo.url,
}

export const usdcWethPoolAddress = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'

export const validPoolDataResponse = {
  data: {
    feeTier: {
      feeAmount: 500,
      tickSpacing: DEFAULT_TICK_SPACING,
      isDynamic: false,
    },
    token0: validParsedPoolToken0,
    token1: validParsedPoolToken1,
    token0Price: 1605.481,
    token1Price: 0.000622,
    txCount: 5456494,
    idOrAddress: usdcWethPoolAddress,
    volumeUSD24HChange: -17.753809465717136,
    volumeUSD24H: 194273059.265625,
    tvlUSD: 223166198.4690675,
    tvlUSDChange: -0.3657085465786977,
    tvlToken0: 90930713.7356909,
    tvlToken1: 82526.48678530742,
  } as PoolData,
  loading: false,
  error: false,
}
