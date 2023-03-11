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
  SearchTokensQuery,
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

export const MAX_FIXTURE_TIMESTAMP = 1609459200

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
  timestamp: faker.datatype.number({ max: MAX_FIXTURE_TIMESTAMP }),
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

export const Erc20ReceiveAssetActivity: RequiredAssetActivity = {
  ...AssetActivityBase,
  id: faker.datatype.uuid(),
  transaction: {
    ...AssetActivityBase.transaction,
    hash: faker.finance.ethereumAddress(), // need unique ID
  },
  type: ActivityType.Receive,
  assetChanges: [Erc20TransferInAssetChange],
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

export const PortfoliosWithReceive: [PortfolioWithActivity] = [
  {
    id: faker.datatype.uuid(),
    ownerAddress: ACCOUNT_ADDRESS_ONE,
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
    assetActivities: [Erc20ReceiveAssetActivity],
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
        priceHistory: [
          {
            id: faker.datatype.uuid(),
            timestamp: faker.date.past(/*year=*/ 2).getMilliseconds(),
            value: Number(faker.random.numeric(10)),
          },
          {
            id: faker.datatype.uuid(),
            timestamp: faker.date.past(/*year=*/ 2).getMilliseconds(),
            value: Number(faker.random.numeric(10)),
          },
        ],
      },
    ],
  },
]

export const SearchTokens: NonNullable<SearchTokensQuery['searchTokens']> = [
  {
    __typename: 'Token',
    address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    chain: Chain.Arbitrum,
    decimals: 18,
    id: 'VG9rZW46QVJCSVRSVU1fMHhEQTEwMDA5Y0JkNUQwN2RkMENlQ2M2NjE2MUZDOTNEN2M5MDAwZGEx',
    name: 'Dai Stablecoin',
    project: {
      __typename: 'TokenProject',
      id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4REExMDAwOWNCZDVEMDdkZDBDZUNjNjYxNjFGQzkzRDdjOTAwMGRhMQ==',
      logoUrl:
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DAI',
  },
  {
    __typename: 'Token',
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    chain: Chain.Ethereum,
    decimals: 18,
    id: 'VG9rZW46RVRIRVJFVU1fMHg2YjE3NTQ3NGU4OTA5NGM0NGRhOThiOTU0ZWVkZWFjNDk1MjcxZDBm',
    name: 'Dai Stablecoin',
    project: {
      __typename: 'TokenProject',
      id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4REExMDAwOWNCZDVEMDdkZDBDZUNjNjYxNjFGQzkzRDdjOTAwMGRhMQ==',
      logoUrl:
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DAI',
  },
  {
    __typename: 'Token',
    address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
    chain: Chain.Optimism,
    decimals: 18,
    id: 'VG9rZW46T1BUSU1JU01fMHhkYTEwMDA5Y2JkNWQwN2RkMGNlY2M2NjE2MWZjOTNkN2M5MDAwZGEx',
    name: 'Dai Stablecoin',
    project: {
      __typename: 'TokenProject',
      id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4REExMDAwOWNCZDVEMDdkZDBDZUNjNjYxNjFGQzkzRDdjOTAwMGRhMQ==',
      logoUrl:
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DAI',
  },
  {
    __typename: 'Token',
    address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
    chain: Chain.Polygon,
    decimals: 18,
    id: 'VG9rZW46UE9MWUdPTl8weDhmM2NmN2FkMjNjZDNjYWRiZDk3MzVhZmY5NTgwMjMyMzljNmEwNjM=',
    name: '(PoS) Dai Stablecoin',
    project: {
      __typename: 'TokenProject',
      id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4REExMDAwOWNCZDVEMDdkZDBDZUNjNjYxNjFGQzkzRDdjOTAwMGRhMQ==',
      logoUrl:
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DAI',
  },
  {
    __typename: 'Token',
    address: '0x993f2cafe9dbe525243f4a78bebc69dac8d36000',
    chain: Chain.Polygon,
    decimals: 18,
    id: 'VG9rZW46UE9MWUdPTl8weDk5M2YyQ2FmRTlkYkU1MjUyNDNmNEE3OEJlQkM2OURBYzhEMzYwMDA=',
    name: 'DIA',
    project: {
      __typename: 'TokenProject',
      id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4Y2E2NDI0NjdDNkViZTU4YzEzY0I0QTcwOTEzMTdmMzRFMTdhYzA1ZQ==',
      logoUrl:
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x84cA8bc7997272c7CfB4D0Cd3D55cd942B3c9419/logo.png',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DIA',
  },
  {
    __typename: 'Token',
    address: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
    chain: Chain.Ethereum,
    decimals: 18,
    id: 'VG9rZW46RVRIRVJFVU1fMHgxNDk0Q0ExRjExRDQ4N2MyYkJlNDU0M0U5MDA4MEFlQmE0QkEzQzJi',
    name: 'DefiPulse Index',
    project: {
      __typename: 'TokenProject',
      id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkVUSEVSRVVNXzB4MTQ5NENBMUYxMUQ0ODdjMmJCZTQ1NDNFOTAwODBBZUJhNEJBM0MyYg==',
      logoUrl:
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b/logo.png',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DPI',
  },
  {
    __typename: 'Token',
    address: '0xca642467c6ebe58c13cb4a7091317f34e17ac05e',
    chain: Chain.Arbitrum,
    decimals: 18,
    id: 'VG9rZW46QVJCSVRSVU1fMHhjYTY0MjQ2N0M2RWJlNThjMTNjQjRBNzA5MTMxN2YzNEUxN2FjMDVl',
    name: 'DIA',
    project: {
      __typename: 'TokenProject',
      id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4Y2E2NDI0NjdDNkViZTU4YzEzY0I0QTcwOTEzMTdmMzRFMTdhYzA1ZQ==',
      logoUrl:
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x84cA8bc7997272c7CfB4D0Cd3D55cd942B3c9419/logo.png',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DIA',
  },
  {
    __typename: 'Token',
    address: '0x85955046df4668e1dd369d2de9f3aeb98dd2a369',
    chain: Chain.Polygon,
    decimals: 18,
    id: 'VG9rZW46UE9MWUdPTl8weDg1OTU1MDQ2REY0NjY4ZTFERDM2OUQyREU5ZjNBRUI5OEREMkEzNjk=',
    name: 'DeFi Pulse Index',
    project: {
      __typename: 'TokenProject',
      id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkVUSEVSRVVNXzB4MTQ5NENBMUYxMUQ0ODdjMmJCZTQ1NDNFOTAwODBBZUJhNEJBM0MyYg==',
      logoUrl:
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b/logo.png',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'DPI',
  },
  {
    __typename: 'Token',
    address: '0x7fb688ccf682d58f86d7e38e03f9d22e7705448b',
    chain: Chain.Optimism,
    decimals: 18,
    id: 'VG9rZW46T1BUSU1JU01fMHg3RkI2ODhDQ2Y2ODJkNThmODZEN2UzOGUwM2Y5RDIyZTc3MDU0NDhC',
    name: 'Rai Reflex Index',
    project: {
      __typename: 'TokenProject',
      id: 'VG9rZW5Qcm9qZWN0OlRva2VuOkFSQklUUlVNXzB4YWVGNWJiY2JGYTQzODUxOWE1ZWE4MEI0YzcxODFCNEU3OGQ0MTlmMg==',
      logoUrl:
        'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919/logo.png',
      safetyLevel: SafetyLevel.Verified,
    },
    symbol: 'RAI',
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
