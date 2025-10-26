import { Token as SDKToken } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import {
  DAI,
  USDC,
  USDC_ARBITRUM,
  USDC_BASE,
  USDC_OPTIMISM,
  USDC_POLYGON,
  WRAPPED_NATIVE_CURRENCY,
} from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { amounts } from 'uniswap/src/test/fixtures/gql/amounts'
import { get24hPriceChange, getLatestPrice, priceHistory } from 'uniswap/src/test/fixtures/gql/history'
import { GQL_CHAINS, image } from 'uniswap/src/test/fixtures/gql/misc'
import { ETH } from 'uniswap/src/test/fixtures/lib'
import { faker, MAX_FIXTURE_TIMESTAMP } from 'uniswap/src/test/shared'
import { createFixture, randomChoice, randomEnumValue } from 'uniswap/src/test/utils'

const benignProtectionInfo: GraphQLApi.ProtectionInfo = {
  result: GraphQLApi.ProtectionResult.Benign,
  attackTypes: [],
  blockaidFees: {
    buy: 0,
    sell: 0,
    transfer: 0,
  },
}

/**
 * Base fixtures
 */

type TokenOptions = {
  sdkToken: SDKToken | null
  market: GraphQLApi.TokenMarket | undefined
  protectionInfo: GraphQLApi.ProtectionInfo | undefined
}

export const token = createFixture<GraphQLApi.Token, TokenOptions>({
  sdkToken: null,
  market: undefined,
  protectionInfo: benignProtectionInfo,
})(({ sdkToken, market, protectionInfo }) => ({
  __typename: 'Token',
  id: faker.datatype.uuid(),
  name: sdkToken?.name ?? faker.lorem.word(),
  symbol: sdkToken?.symbol ?? faker.lorem.word(),
  decimals: sdkToken?.decimals ?? faker.datatype.number({ min: 1, max: 18 }),
  chain: (sdkToken ? toGraphQLChain(sdkToken.chainId) : null) ?? randomChoice(GQL_CHAINS),
  address: sdkToken?.address.toLocaleLowerCase() ?? faker.finance.ethereumAddress(),
  standard: sdkToken?.address ? GraphQLApi.TokenStandard.Erc20 : GraphQLApi.TokenStandard.Native,
  market,
  project: tokenProjectBase(),
  feeData: {
    buyFeeBps: '',
    sellFeeBps: '',
  },
  protectionInfo,
}))

export const tokenBalance = createFixture<GraphQLApi.TokenBalance>()(() => ({
  __typename: 'TokenBalance',
  id: faker.datatype.uuid(),
  blockNumber: faker.datatype.number({ max: 1000000 }),
  blockTimestamp: faker.datatype.number({ max: MAX_FIXTURE_TIMESTAMP }),
  denominatedValue: amounts.md(),
  isHidden: faker.datatype.boolean(),
  ownerAddress: faker.finance.ethereumAddress(),
  quantity: faker.datatype.number({ min: 1, max: 1000 }),
  token: token(),
  tokenProjectMarket: tokenProjectMarket(),
}))

type TokenMarketOptions = {
  priceHistory: (GraphQLApi.TimestampedAmount | undefined)[]
}

export const tokenMarket = createFixture<GraphQLApi.TokenMarket, TokenMarketOptions>(() => ({
  priceHistory: priceHistory({ duration: GraphQLApi.HistoryDuration.Week, size: 7 }),
}))(({ priceHistory: history }) => ({
  __typename: 'TokenMarket',
  id: faker.datatype.uuid(),
  token: ethToken(),
  priceSource: randomEnumValue(GraphQLApi.PriceSource),
  priceHistory: history,
  price: getLatestPrice(history),
  pricePercentChange: get24hPriceChange(history),
}))

type TokenProjectMarketOptions = {
  priceHistory: (GraphQLApi.TimestampedAmount | undefined)[]
}

export const tokenProjectMarket = createFixture<GraphQLApi.TokenProjectMarket, TokenProjectMarketOptions>(() => ({
  priceHistory: priceHistory({ duration: GraphQLApi.HistoryDuration.Week, size: 7 }),
}))(({ priceHistory: history }) => ({
  __typename: 'TokenProjectMarket',
  id: faker.datatype.uuid(),
  priceHistory: history,
  price: getLatestPrice(history),
  pricePercentChange24h: get24hPriceChange(history),
  relativeChange24: get24hPriceChange(history),
  currency: randomEnumValue(GraphQLApi.Currency),
  tokenProject: tokenProjectBase(),
}))

const tokenProjectBase = createFixture<GraphQLApi.TokenProject>()(() => {
  const logoUrl = faker.image.imageUrl()
  return {
    __typename: 'TokenProject',
    id: faker.datatype.uuid(),
    name: faker.lorem.word(),
    tokens: [] as GraphQLApi.Token[],
    safetyLevel: GraphQLApi.SafetyLevel.Verified,
    // @deprecated
    logoUrl,
    isSpam: faker.datatype.boolean(),
    logo: image({ url: logoUrl }),
    spamCode: faker.datatype.number(),
  }
})

type TokenProjectOptions = {
  priceHistory: (GraphQLApi.TimestampedAmount | undefined)[]
  safetyLevel: GraphQLApi.SafetyLevel | undefined
}

export const tokenProject = createFixture<GraphQLApi.TokenProject, TokenProjectOptions>(() => ({
  priceHistory: priceHistory({ duration: GraphQLApi.HistoryDuration.Week, size: 7 }),
  safetyLevel: GraphQLApi.SafetyLevel.Verified,
}))(({ priceHistory: history, safetyLevel }) => ({
  ...tokenProjectBase({
    markets: [tokenProjectMarket({ priceHistory: history })],
    safetyLevel,
  }),
}))

export const usdcTokenProject = createFixture<GraphQLApi.TokenProject, TokenProjectOptions>(() => ({
  priceHistory: priceHistory({ duration: GraphQLApi.HistoryDuration.Week, size: 7 }),
  safetyLevel: GraphQLApi.SafetyLevel.Verified,
}))(({ priceHistory: history, safetyLevel }) =>
  tokenProject({
    priceHistory: history,
    tokens: [
      token({ sdkToken: USDC, market: tokenMarket() }),
      token({ sdkToken: USDC_POLYGON }),
      token({ sdkToken: USDC_ARBITRUM }),
      token({ sdkToken: USDC_BASE, market: tokenMarket() }),
      token({ sdkToken: USDC_OPTIMISM }),
    ],
    safetyLevel,
  }),
)

/**
 * Derived fixtures
 */

const ethProject = tokenProject({
  name: 'Ethereum',
  safetyLevel: GraphQLApi.SafetyLevel.Verified,
  isSpam: false,
})

export const ethToken = createFixture<GraphQLApi.Token>()(() => token({ sdkToken: ETH, project: ethProject }))
export const wethToken = createFixture<GraphQLApi.Token>()(() =>
  token({ sdkToken: WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet], project: ethProject }),
)

const daiProject = tokenProject({
  name: 'Dai Stablecoin',
  safetyLevel: GraphQLApi.SafetyLevel.Verified,
  isSpam: false,
})

export const daiToken = createFixture<GraphQLApi.Token>()(() => token({ sdkToken: DAI, project: daiProject }))

const usdcProject = tokenProject({
  name: 'USD Coin',
  safetyLevel: GraphQLApi.SafetyLevel.Verified,
  isSpam: false,
})

export const usdcToken = createFixture<GraphQLApi.Token>()(() => token({ sdkToken: USDC, project: usdcProject }))
export const usdcBaseToken = createFixture<GraphQLApi.Token>()(() =>
  token({ sdkToken: USDC_BASE, project: usdcProject }),
)
export const usdcArbitrumToken = createFixture<GraphQLApi.Token>()(() =>
  token({ sdkToken: USDC_ARBITRUM, project: usdcProject }),
)
