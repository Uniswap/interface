import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, Currency, WETH9 } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Position } from '@uniswap/v3-sdk'
import { USDC_MAINNET } from 'constants/tokens'
import { Token as BEToken } from 'graphql/data/__generated__/types-and-hooks'
import { PoolData } from 'graphql/data/pools/usePoolData'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'

export const validParams = { poolAddress: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', chainName: 'ethereum' }

export const validPoolToken0 = {
  id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: '6',
  derivedETH: '0.0006240873011635544626425964678706127',
  __typename: 'Token',
} as Token
export const validBEPoolToken0 = {
  ...validPoolToken0,
  address: validPoolToken0.id,
  chain: 'ETHEREUM',
  decimals: 6,
} as BEToken

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
  wrapped: validPoolToken0,
} as unknown as Currency

const validPoolToken1 = {
  id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  symbol: 'WETH',
  name: 'Wrapped Ether',
  decimals: '18',
  derivedETH: '1',
  __typename: 'Token',
} as Token
export const validBEPoolToken1 = {
  ...validPoolToken1,
  address: validPoolToken1.id,
  chain: 'ETHEREUM',
  decimals: 18,
} as BEToken

export const owner = '0xf5b6bb25f5beaea03dd014c6ef9fa9f3926bf36c'

const pool = new Pool(
  USDC_MAINNET,
  WETH9[ChainId.MAINNET],
  FeeAmount.MEDIUM,
  '1851127709498178402383049949138810',
  '7076437181775065414',
  201189
)

const position = new Position({
  pool,
  liquidity: 1341008833950736,
  tickLower: 200040,
  tickUpper: 202560,
})
const details = {
  nonce: BigNumber.from('0'),
  tokenId: BigNumber.from('0'),
  operator: '0x0',
  token0: USDC_MAINNET.address,
  token1: WETH9[ChainId.MAINNET].address,
  fee: FeeAmount.MEDIUM,
  tickLower: -100,
  tickUpper: 100,
  liquidity: BigNumber.from('9000'),
  feeGrowthInside0LastX128: BigNumber.from('0'),
  feeGrowthInside1LastX128: BigNumber.from('0'),
  tokensOwed0: BigNumber.from('0'),
  tokensOwed1: BigNumber.from('0'),
}
export const useMultiChainPositionsReturnValue = {
  positions: [
    {
      owner,
      chainId: ChainId.MAINNET,
      position,
      pool,
      details,
      inRange: true,
      closed: false,
    },
  ],
  loading: false,
}

export const usdcWethPoolAddress = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'

export const validPoolDataResponse = {
  data: {
    feeTier: 500,
    token0: validBEPoolToken0,
    token1: validBEPoolToken1,
    token0Price: 1605.481,
    token1Price: 0.000622,
    txCount: 5456494,
    address: usdcWethPoolAddress,
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
