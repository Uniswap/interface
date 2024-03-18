import { Token as SDKToken } from '@uniswap/sdk-core'
import {
  Currency,
  HistoryDuration,
  PriceSource,
  SafetyLevel,
  TimestampedAmount,
  Token,
  TokenBalance,
  TokenMarket,
  TokenProject,
  TokenProjectMarket,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { toGraphQLChain } from 'wallet/src/features/chains/utils'
import { amounts } from 'wallet/src/test/fixtures/gql/amounts'
import {
  get24hPriceChange,
  getLatestPrice,
  priceHistory,
} from 'wallet/src/test/fixtures/gql/history'
import { GQL_CHAINS } from 'wallet/src/test/fixtures/gql/misc'
import {
  DAI,
  ETH,
  USDBC_BASE,
  USDC,
  USDC_ARBITRUM,
  USDC_OPTIMISM,
  USDC_POLYGON,
  WETH,
} from 'wallet/src/test/fixtures/lib'
import { MAX_FIXTURE_TIMESTAMP, faker } from 'wallet/src/test/shared'
import { createFixture, randomChoice, randomEnumValue } from 'wallet/src/test/utils'

/**
 * Base fixtures
 */

type TokenOptions = {
  sdkToken: SDKToken | null
}

export const token = createFixture<Token, TokenOptions>({ sdkToken: null })(({ sdkToken }) => ({
  __typename: 'Token',
  id: faker.datatype.uuid(),
  name: sdkToken?.name ?? faker.lorem.word(),
  symbol: sdkToken?.symbol ?? faker.lorem.word(),
  decimals: sdkToken?.decimals ?? faker.datatype.number({ min: 1, max: 18 }),
  chain: (sdkToken ? toGraphQLChain(sdkToken.chainId) : null) ?? randomChoice(GQL_CHAINS),
  address: sdkToken?.address.toLocaleLowerCase() ?? faker.finance.ethereumAddress(),
  market: null,
  project: tokenProjectBase(),
}))

export const tokenBalance = createFixture<TokenBalance>()(() => ({
  __typename: 'TokenBalance',
  id: faker.datatype.uuid(),
  blockNumber: faker.datatype.number({ max: 1000000 }),
  blockTimestamp: faker.datatype.number({ max: MAX_FIXTURE_TIMESTAMP }),
  denominatedValue: amounts.md(),
  isHidden: faker.datatype.boolean(),
  ownerAddress: faker.finance.ethereumAddress(),
  quantity: faker.datatype.number({ min: 1, max: 1000 }),
  token: token(),
}))

type TokenMarketOptions = {
  priceHistory: (TimestampedAmount | null)[]
}

export const tokenMarket = createFixture<TokenMarket, TokenMarketOptions>(() => ({
  priceHistory: priceHistory({ duration: HistoryDuration.Week, size: 7 }),
}))(({ priceHistory: history }) => ({
  __typename: 'TokenMarket',
  id: faker.datatype.uuid(),
  token: ethToken(),
  priceSource: randomEnumValue(PriceSource),
  priceHistory: history,
  price: history ? getLatestPrice(history) : null,
  pricePercentChange: history ? get24hPriceChange(history) : null,
}))

type TokenProjectMarketOptions = {
  priceHistory: (TimestampedAmount | null)[]
}

export const tokenProjectMarket = createFixture<TokenProjectMarket, TokenProjectMarketOptions>(
  () => ({
    priceHistory: priceHistory({ duration: HistoryDuration.Week, size: 7 }),
  })
)(({ priceHistory: history }) => ({
  __typename: 'TokenProjectMarket',
  id: faker.datatype.uuid(),
  priceHistory: history,
  price: getLatestPrice(history),
  pricePercentChange24h: get24hPriceChange(history),
  currency: randomEnumValue(Currency),
  tokenProject: tokenProjectBase(),
}))

const tokenProjectBase = createFixture<TokenProject>()(() => ({
  __typename: 'TokenProject',
  id: faker.datatype.uuid(),
  name: faker.lorem.word(),
  tokens: [] as Token[],
  safetyLevel: randomEnumValue(SafetyLevel),
  logoUrl: faker.image.imageUrl(),
  isSpam: faker.datatype.boolean(),
}))

type TokenProjectOptions = {
  priceHistory: (TimestampedAmount | null)[]
}

export const tokenProject = createFixture<TokenProject, TokenProjectOptions>(() => ({
  priceHistory: priceHistory({ duration: HistoryDuration.Week, size: 7 }),
}))(({ priceHistory: history }) => ({
  ...tokenProjectBase({
    markets: [tokenProjectMarket({ priceHistory: history })],
  }),
}))

export const usdcTokenProject = createFixture<TokenProject, TokenProjectOptions>(() => ({
  priceHistory: priceHistory({ duration: HistoryDuration.Week, size: 7 }),
}))(({ priceHistory: history }) =>
  tokenProject({
    priceHistory: history,
    tokens: [
      token({ sdkToken: USDC, market: tokenMarket() }),
      token({ sdkToken: USDC_POLYGON }),
      token({ sdkToken: USDC_ARBITRUM }),
      token({ sdkToken: USDBC_BASE, market: tokenMarket() }),
      token({ sdkToken: USDC_OPTIMISM }),
    ],
  })
)

/**
 * Derived fixtures
 */

const ethProject = tokenProject({
  name: 'Ethereum',
  safetyLevel: SafetyLevel.Verified,
  isSpam: false,
})

export const ethToken = createFixture<Token>()(() => token({ sdkToken: ETH, project: ethProject }))
export const wethToken = createFixture<Token>()(() =>
  token({ sdkToken: WETH, project: ethProject })
)

const daiProject = tokenProject({
  name: 'Dai Stablecoin',
  safetyLevel: SafetyLevel.Verified,
  isSpam: false,
})

export const daiToken = createFixture<Token>()(() => token({ sdkToken: DAI, project: daiProject }))

const usdcProject = tokenProject({
  name: 'USD Coin',
  safetyLevel: SafetyLevel.Verified,
  isSpam: false,
})

export const usdcToken = createFixture<Token>()(() =>
  token({ sdkToken: USDC, project: usdcProject })
)
export const usdcBaseToken = createFixture<Token>()(() =>
  token({ sdkToken: USDBC_BASE, project: usdcProject })
)
export const usdcArbitrumToken = createFixture<Token>()(() =>
  token({ sdkToken: USDC_ARBITRUM, project: usdcProject })
)
