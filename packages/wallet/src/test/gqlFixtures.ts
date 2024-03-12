/* eslint-disable max-lines */
import { faker } from '@faker-js/faker'
import { NativeCurrency } from '@uniswap/sdk-core'
import { getWrappedNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { DAI, USDBC_BASE, USDC, USDC_ARBITRUM } from 'wallet/src/constants/tokens'
import {
  Amount,
  AssetActivity,
  AssetChange,
  Chain,
  Currency,
  HistoryDuration,
  NftAssetTrait,
  NftCollection,
  Portfolio as PortfolioType,
  PriceSource,
  SafetyLevel,
  SearchTokensQuery,
  Token,
  TokenApproval,
  TokenBalance,
  TokenMarket as TokenMarketType,
  TokenProject as TokenProjectType,
  TokenStandard,
  TokenTransfer,
  TransactionDetails,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import {
  ETH,
  FAKER_SEED,
  MAX_FIXTURE_TIMESTAMP,
  SAMPLE_SEED_ADDRESS_1,
  SAMPLE_SEED_ADDRESS_2,
} from 'wallet/src/test/fixtures'
import {
  createTokenAsset,
  createTokenBalance,
  mockTokenPriceHistory,
  mockTokenProject,
} from 'wallet/src/test/helpers'

faker.seed(FAKER_SEED)

export const Amounts: Record<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl', Amount> = {
  none: {
    id: faker.datatype.uuid(),
    value: 0,
    currency: Currency.Usd,
  },
  xs: {
    id: faker.datatype.uuid(),
    value: 0.05,
    currency: Currency.Usd,
  },
  sm: {
    id: faker.datatype.uuid(),
    value: 5,
    currency: Currency.Usd,
  },
  md: {
    id: faker.datatype.uuid(),
    value: 55,
    currency: Currency.Usd,
  },
  lg: {
    id: faker.datatype.uuid(),
    value: 5500,
    currency: Currency.Usd,
  },
  xl: {
    id: faker.datatype.uuid(),
    value: 500000,
    currency: Currency.Usd,
  },
}

export const EthAsset = createTokenAsset(ETH, Chain.Ethereum)
export const DaiAsset = createTokenAsset(DAI, Chain.Ethereum)
export const UsdBaseAsset = createTokenAsset(USDBC_BASE, Chain.Base)
export const UsdArbitrumAsset = createTokenAsset(USDC_ARBITRUM, Chain.Arbitrum)

/**
 * Must explicitly define the returned typename in order
 * for MockedResponse to infer correct assetActivity response type.
 */

type RequiredAssetActivity = Omit<AssetActivity, 'transaction' | 'assetChanges' | 'type'> & {
  details: TransactionDetails & {
    assetChanges: (AssetChange & { __typename: 'TokenApproval' | 'TokenTransfer' })[]
  }
}
type PortfolioWithActivityAndTokenBalances = Omit<PortfolioType, 'assetActivities'> & {
  assetActivities: RequiredAssetActivity[]
  tokenBalances: TokenBalance[]
}

const AssetActivityBase = {
  __typeName: 'AssetActivity',
  timestamp: faker.datatype.number({ max: MAX_FIXTURE_TIMESTAMP }),
  chain: Chain.Ethereum,
  details: {
    __typename: 'TransactionDetails' as const,
    id: 'base_tranaction_id',
    status: TransactionStatus.Confirmed,
    to: SAMPLE_SEED_ADDRESS_2,
    from: SAMPLE_SEED_ADDRESS_1,
    nonce: faker.datatype.number(),
    blockNumber: 1,
    assetChanges: [],
  },
}

const Erc20TransferOutAssetChange: TokenTransfer & { __typename: 'TokenTransfer' } = {
  __typename: 'TokenTransfer',
  id: faker.datatype.uuid(),
  asset: DaiAsset,
  tokenStandard: TokenStandard.Erc20,
  quantity: '1',
  sender: SAMPLE_SEED_ADDRESS_1,
  recipient: SAMPLE_SEED_ADDRESS_2,
  direction: TransactionDirection.Out,
  transactedValue: {
    id: faker.datatype.uuid(),
    currency: Currency.Usd,
    value: 1,
  },
}

const Erc20TransferInAssetChange: TokenTransfer & { __typename: 'TokenTransfer' } = {
  ...Erc20TransferOutAssetChange,
  __typename: 'TokenTransfer',
  id: faker.datatype.uuid(),
  direction: TransactionDirection.In,
}

const Erc20ApproveAssetChange: TokenApproval & { __typename: 'TokenApproval' } = {
  __typename: 'TokenApproval',
  id: faker.datatype.uuid(),
  asset: DaiAsset,
  tokenStandard: TokenStandard.Erc20,
  approvedAddress: SAMPLE_SEED_ADDRESS_2,
  quantity: '1',
}

const ApproveAssetActivity: RequiredAssetActivity = {
  ...AssetActivityBase,
  id: faker.datatype.uuid(),
  details: {
    ...AssetActivityBase.details,
    hash: faker.finance.ethereumAddress(), // need unique ID
    type: TransactionType.Approve,
    assetChanges: [Erc20ApproveAssetChange],
    transactionStatus: TransactionStatus.Confirmed,
  },
}

export const Erc20SwapAssetActivity: RequiredAssetActivity = {
  ...AssetActivityBase,
  id: faker.datatype.uuid(),
  details: {
    ...AssetActivityBase.details,
    hash: faker.finance.ethereumAddress(), // need unique ID
    type: TransactionType.Swap,
    assetChanges: [Erc20TransferInAssetChange, Erc20TransferOutAssetChange],
    transactionStatus: TransactionStatus.Confirmed,
  },
}

export const Erc20ReceiveAssetActivity: RequiredAssetActivity = {
  ...AssetActivityBase,
  id: faker.datatype.uuid(),
  details: {
    ...AssetActivityBase.details,
    hash: faker.finance.ethereumAddress(), // need unique ID
    type: TransactionType.Receive,
    assetChanges: [Erc20TransferInAssetChange],
    transactionStatus: TransactionStatus.Confirmed,
  },
}

export const TokenBalances: [TokenBalance, TokenBalance] = [
  createTokenBalance(SAMPLE_SEED_ADDRESS_1, DaiAsset, true),
  createTokenBalance(SAMPLE_SEED_ADDRESS_2, EthAsset, false),
]

// These are with different chanins
export const TokenBalances2: [TokenBalance, TokenBalance] = [
  createTokenBalance(SAMPLE_SEED_ADDRESS_1, UsdBaseAsset, false),
  createTokenBalance(SAMPLE_SEED_ADDRESS_2, UsdArbitrumAsset, true),
]

export const Portfolios: [
  PortfolioWithActivityAndTokenBalances,
  PortfolioWithActivityAndTokenBalances
] = [
  {
    id: faker.datatype.uuid(),
    ownerAddress: SAMPLE_SEED_ADDRESS_1,
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
    tokenBalances: TokenBalances,
    assetActivities: [ApproveAssetActivity, Erc20SwapAssetActivity],
  },
  {
    id: faker.datatype.uuid(),
    ownerAddress: SAMPLE_SEED_ADDRESS_2,
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
    tokenBalances: TokenBalances2,
    assetActivities: [ApproveAssetActivity, Erc20SwapAssetActivity],
  },
]

export const PortfoliosWithReceive: [PortfolioWithActivityAndTokenBalances] = [
  {
    id: faker.datatype.uuid(),
    ownerAddress: SAMPLE_SEED_ADDRESS_1,
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
    tokenBalances: TokenBalances,
    assetActivities: [Erc20ReceiveAssetActivity],
  },
]

export const Portfolio = Portfolios[0] as PortfolioType
export const Portfolio2 = Portfolios[1] as PortfolioType

export const PortfolioBalancesById: Record<string, PortfolioBalance> = {
  '1-0x6b175474e89094c44da98b954eedeac495271d0f': {
    cacheId: 'TokenBalance:d76790c0-657f-4c9c-929c-372e55d4874e',
    quantity: 146,
    balanceUSD: 55,
    currencyInfo: {
      currency: {
        ...DAI,
        address: DAI.address.toLocaleLowerCase(),
      } as typeof DAI,
      currencyId: '1-0x6b175474e89094c44da98b954eedeac495271d0f',
      logoUrl: 'I%hYU9(rWW',
      isSpam: false,
      safetyLevel: SafetyLevel.Verified,
    },
    relativeChange24: expect.any(Number),
    isHidden: true,
  },
  '1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
    cacheId: 'TokenBalance:da5cfdf1-6aa9-46a4-8164-b426920f017a',
    quantity: 442,
    balanceUSD: 55,
    currencyInfo: {
      currency: {
        chainId: 1,
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
        isNative: true,
        isToken: false,
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      } as unknown as NativeCurrency,
      safetyLevel: SafetyLevel.Verified,
      currencyId: '1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      isSpam: false,
      logoUrl: 't<|U8cUQlA',
    },
    relativeChange24: expect.any(Number),
    isHidden: false,
  },
  '8453-0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca': {
    balanceUSD: 55,
    cacheId: 'TokenBalance:e645fd94-101e-49dc-8285-1f1ed567a9f0',
    currencyInfo: {
      currency: {
        ...USDBC_BASE,
        address: USDBC_BASE.address.toLocaleLowerCase(),
      } as typeof USDBC_BASE,
      currencyId: '8453-0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
      isSpam: false,
      logoUrl: '#_fELb,zS)',
      safetyLevel: SafetyLevel.Verified,
    },
    isHidden: false,
    quantity: 63,
    relativeChange24: expect.any(Number),
  },
  '42161-0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': {
    balanceUSD: 55,
    cacheId: 'TokenBalance:0a02bee6-7769-48dd-ba33-6c32c219f34b',
    currencyInfo: {
      currency: {
        ...USDC_ARBITRUM,
        address: USDC_ARBITRUM.address.toLocaleLowerCase(),
      } as typeof USDC_ARBITRUM,
      currencyId: '42161-0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
      isSpam: false,
      logoUrl: '7$l<tG%C=@',
      safetyLevel: SafetyLevel.Verified,
    },
    isHidden: true,
    quantity: 350,
    relativeChange24: expect.any(Number),
  },
}

export const TokenDayPriceHistory = mockTokenPriceHistory(HistoryDuration.Day)
export const TokenWeekPriceHistory = mockTokenPriceHistory(HistoryDuration.Week)
export const TokenMonthPriceHistory = mockTokenPriceHistory(HistoryDuration.Month)
export const TokenYearPriceHistory = mockTokenPriceHistory(HistoryDuration.Year)

export const TokenProjectDay = mockTokenProject(TokenDayPriceHistory)
export const TokenProjectWeek = mockTokenProject(TokenWeekPriceHistory)
export const TokenProjectMonth = mockTokenProject(TokenMonthPriceHistory)
export const TokenProjectYear = mockTokenProject(TokenYearPriceHistory)

export const TokenProjects: [TokenProjectType] = [TokenProjectDay]

export const SearchTokens: NonNullable<SearchTokensQuery['searchTokens']> = [
  {
    __typename: 'Token',
    address: faker.finance.ethereumAddress(),
    chain: Chain.Arbitrum,
    decimals: 18,
    id: faker.datatype.uuid(),
    project: {
      __typename: 'TokenProject',
      id: '1',
      logoUrl: faker.image.imageUrl(),
      name: 'Dai Stablecoin',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DAI',
  },
  {
    __typename: 'Token',
    address: faker.finance.ethereumAddress(),
    chain: Chain.Ethereum,
    decimals: 18,
    id: faker.datatype.uuid(),
    project: {
      __typename: 'TokenProject',
      id: '1',
      logoUrl: faker.image.imageUrl(),
      name: 'Dai Stablecoin',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DAI',
  },
  {
    __typename: 'Token',
    address: faker.finance.ethereumAddress(),
    chain: Chain.Optimism,
    decimals: 18,
    id: faker.datatype.uuid(),
    project: {
      __typename: 'TokenProject',
      id: '1',
      logoUrl: faker.image.imageUrl(),
      name: 'Dai Stablecoin',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DAI',
  },
  {
    __typename: 'Token',
    address: faker.finance.ethereumAddress(),
    chain: Chain.Polygon,
    decimals: 18,
    id: faker.datatype.uuid(),
    project: {
      __typename: 'TokenProject',
      id: '1',
      logoUrl: faker.image.imageUrl(),
      name: 'Dai Stablecoin',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DAI',
  },
  {
    __typename: 'Token',
    address: faker.finance.ethereumAddress(),
    chain: Chain.Polygon,
    decimals: 18,
    id: faker.datatype.uuid(),
    project: {
      __typename: 'TokenProject',
      id: '2',
      logoUrl: faker.image.imageUrl(),
      name: 'DIA',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DIA',
  },
  {
    __typename: 'Token',
    address: faker.finance.ethereumAddress(),
    chain: Chain.Ethereum,
    decimals: 18,
    id: faker.datatype.uuid(),
    project: {
      __typename: 'TokenProject',
      id: '3',
      logoUrl: faker.image.imageUrl(),
      name: 'DefiPulse Index',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DPI',
  },
  {
    __typename: 'Token',
    address: faker.finance.ethereumAddress(),
    chain: Chain.Arbitrum,
    decimals: 18,
    id: faker.datatype.uuid(),
    project: {
      __typename: 'TokenProject',
      id: '2',
      logoUrl: faker.image.imageUrl(),
      name: 'DIA',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DIA',
  },
  {
    __typename: 'Token',
    address: faker.finance.ethereumAddress(),
    chain: Chain.Polygon,
    decimals: 18,
    id: faker.datatype.uuid(),
    project: {
      __typename: 'TokenProject',
      id: '3',
      logoUrl: faker.image.imageUrl(),
      name: 'DefiPulse Index',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DPI',
  },
  {
    __typename: 'Token',
    address: faker.finance.ethereumAddress(),
    chain: Chain.Optimism,
    decimals: 18,
    id: faker.datatype.uuid(),
    project: {
      __typename: 'TokenProject',
      id: '4',
      logoUrl: faker.image.imageUrl(),
      name: 'Rai Reflex Index',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'RAI',
  },
]

export const EthToken: Token = {
  id: faker.datatype.uuid(),
  address: faker.finance.ethereumAddress(),
  chain: Chain.Ethereum,
  decimals: 2,
  symbol: 'ETH',
  project: {
    safetyLevel: SafetyLevel.Verified,
    id: faker.datatype.uuid(),
    logoUrl: faker.image.imageUrl(),
    name: 'Ethereum',
    tokens: [],
  },
}

export const TopNFTCollections: [NftCollection, NftCollection] = [
  {
    id: faker.datatype.uuid(),
    name: 'Test NFT 1',
    collectionId: faker.datatype.uuid(),
    isVerified: true,
    nftContracts: [
      {
        id: faker.datatype.uuid(),
        chain: Chain.Ethereum,
        address: faker.finance.ethereumAddress(),
      },
    ],
    image: {
      id: faker.datatype.uuid(),
      url: 'image.url',
    },
  },
  {
    id: faker.datatype.uuid(),
    name: 'Test NFT 2',
    collectionId: faker.datatype.uuid(),
    isVerified: true,
    nftContracts: [
      {
        id: faker.datatype.uuid(),
        chain: Chain.Ethereum,
        address: faker.finance.ethereumAddress(),
      },
    ],
    image: {
      id: faker.datatype.uuid(),
      url: 'image.url',
    },
  },
]

export const TopTokens: [Token, Token] = [
  {
    id: faker.datatype.uuid(),
    address: getWrappedNativeAddress(ChainId.Mainnet),
    chain: Chain.Ethereum,
    decimals: 18,
    symbol: 'WETH',
    project: {
      id: faker.datatype.uuid(),
      isSpam: false,
      logoUrl: faker.image.imageUrl(),
      name: 'Wrapped Ether',
      safetyLevel: SafetyLevel.Verified,
      tokens: [],
    },
  },
  {
    id: faker.datatype.uuid(),
    address: USDC.address,
    chain: Chain.Ethereum,
    decimals: USDC.decimals,
    symbol: 'USDC',
    project: {
      id: faker.datatype.uuid(),
      isSpam: true,
      logoUrl: faker.image.imageUrl(),
      name: 'USD Coin',
      safetyLevel: SafetyLevel.Verified,
      tokens: [],
    },
  },
]

export const NFTTrait: NftAssetTrait = {
  __typename: 'NftAssetTrait',
  id: faker.datatype.uuid(),
  name: 'traitName',
  value: 'traitValue',
}

export const TokenMarket: TokenMarketType = {
  id: faker.datatype.uuid(),
  priceSource: PriceSource.SubgraphV3,
  token: EthToken,
  price: Amounts.md,
  pricePercentChange: Amounts.xs,
}
