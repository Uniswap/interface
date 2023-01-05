import { faker } from '@faker-js/faker'
import { ChainId } from 'src/constants/chains'
import { DAI, USDC, WBTC, WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import {
  ActivityType,
  Amount,
  AssetActivity,
  AssetChange,
  Chain,
  Currency,
  Portfolio,
  SafetyLevel,
  Token,
  TokenApproval,
  TokenProject,
  TokenStandard,
  TokenTransfer,
  TransactionDirection,
  TransactionStatus,
} from 'src/data/__generated__/types-and-hooks'
import { ACCOUNT_ADDRESS_ONE, ACCOUNT_ADDRESS_TWO } from 'src/test/fixtures'

const FAKER_SEED = 123
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

export const DaiAsset: Token = {
  id: faker.datatype.uuid(),
  name: DAI.name,
  symbol: DAI.symbol,
  decimals: DAI.decimals,
  chain: Chain.Ethereum,
  address: DAI.address,
  project: {
    id: faker.datatype.uuid(),
    isSpam: false,
    logoUrl: faker.datatype.string(),
    tokens: [],
    safetyLevel: SafetyLevel.Verified,
  },
}

/**
 * Must explicitly define the returned typename in order
 * for MockedReponse to infer correct assetActivity response type.
 */

type RequiredAssetActivity = AssetActivity & {
  assetChanges: (AssetChange & { __typename: 'TokenApproval' | 'TokenTransfer' })[]
}
type PortfolioWithActivity = Portfolio & {
  assetActivities: RequiredAssetActivity[]
}

const AssetActivityBase = {
  __typeName: 'AssetActivity',
  timestamp: faker.datatype.number(),
  chain: Chain.Ethereum,
  transaction: {
    id: 'base_tranaction_id',
    status: TransactionStatus.Confirmed,
    to: ACCOUNT_ADDRESS_TWO,
    from: ACCOUNT_ADDRESS_ONE,
    nonce: faker.datatype.number(),
    blockNumber: 1,
  },
}

const Erc20TransferOutAssetChange: TokenTransfer & { __typename: 'TokenTransfer' } = {
  __typename: 'TokenTransfer',
  id: faker.datatype.uuid(),
  asset: DaiAsset,
  tokenStandard: TokenStandard.Erc20,
  quantity: '1',
  sender: ACCOUNT_ADDRESS_ONE,
  recipient: ACCOUNT_ADDRESS_TWO,
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
  approvedAddress: ACCOUNT_ADDRESS_TWO,
  quantity: '1',
}

const ApproveAssetActivty: RequiredAssetActivity = {
  ...AssetActivityBase,
  id: faker.datatype.uuid(),
  transaction: {
    ...AssetActivityBase.transaction, // need unique ID
    hash: faker.finance.ethereumAddress(),
  },
  type: ActivityType.Approve,
  assetChanges: [Erc20ApproveAssetChange],
}

export const Erc20SwapAssetActivity: RequiredAssetActivity = {
  ...AssetActivityBase,
  id: faker.datatype.uuid(),
  transaction: {
    ...AssetActivityBase.transaction,
    hash: faker.finance.ethereumAddress(), // need unique ID
  },
  type: ActivityType.Swap,
  assetChanges: [Erc20TransferInAssetChange, Erc20TransferOutAssetChange],
}

export const Portfolios: [PortfolioWithActivity, PortfolioWithActivity] = [
  {
    id: faker.datatype.uuid(),
    ownerAddress: ACCOUNT_ADDRESS_ONE,
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
    assetActivities: [ApproveAssetActivty, Erc20SwapAssetActivity],
  },
  {
    id: faker.datatype.uuid(),
    ownerAddress: ACCOUNT_ADDRESS_TWO,
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
    assetActivities: [ApproveAssetActivty, Erc20SwapAssetActivity],
  },
]

export const TokenProjects: [TokenProject] = [
  {
    id: faker.datatype.uuid(),
    description: faker.lorem.sentence(),
    logoUrl: faker.image.imageUrl(),
    name: faker.lorem.word(),
    safetyLevel: SafetyLevel.Verified,
    tokens: [
      {
        id: faker.datatype.uuid(),
        address: faker.finance.ethereumAddress(),
        chain: Chain.Ethereum,
        decimals: 6,
        symbol: faker.lorem.word(),
      },
    ],
    markets: [
      {
        currency: Currency.Eth,
        tokenProject: { id: faker.datatype.uuid(), tokens: [] },
        id: faker.datatype.uuid(),
        price: {
          id: faker.datatype.uuid(),
          value: faker.datatype.number(),
        },
        pricePercentChange24h: {
          id: faker.datatype.uuid(),
          value: 50,
        },
      },
    ],
  },
]

export const EthToken: [Token] = [
  {
    id: faker.datatype.uuid(),
    address: null,
    chain: Chain.Ethereum,
    name: 'Ethereum',
    symbol: 'ETH',
    project: {
      id: faker.datatype.uuid(),
      logoUrl: 'ethlogo.png',
      tokens: [],
    },
  },
]

export const TopTokens: [Token, Token, Token] = [
  {
    id: faker.datatype.uuid(),
    address: WRAPPED_NATIVE_CURRENCY[ChainId.Mainnet].address,
    chain: Chain.Ethereum,
    name: 'Wrapped Ether',
    symbol: 'WETH',
    project: {
      id: faker.datatype.uuid(),
      logoUrl: 'wethlogo.png',
      tokens: [],
    },
  },
  {
    id: faker.datatype.uuid(),
    address: WBTC.address,
    chain: Chain.Ethereum,
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    project: {
      id: faker.datatype.uuid(),
      logoUrl: 'wbtclogo.png',
      tokens: [],
    },
  },
  {
    id: faker.datatype.uuid(),
    address: USDC.address,
    chain: Chain.Ethereum,
    name: 'USD Coin',
    symbol: 'USDC',
    project: {
      id: faker.datatype.uuid(),
      logoUrl: 'usdclogo.png',
      tokens: [],
    },
  },
]
