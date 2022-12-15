import { faker } from '@faker-js/faker'
import { ChainId } from 'src/constants/chains'
import { USDC, WBTC, WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import {
  Amount,
  Chain,
  Currency,
  Portfolio,
  SafetyLevel,
  Token,
  TokenProject,
} from 'src/data/__generated__/types-and-hooks'

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

export const Portfolios: [Portfolio, Portfolio] = [
  {
    id: faker.datatype.uuid(),
    ownerAddress: faker.finance.ethereumAddress(),
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
  },
  {
    id: faker.datatype.uuid(),
    ownerAddress: faker.finance.ethereumAddress(),
    tokensTotalDenominatedValue: Amounts.md,
    tokensTotalDenominatedValueChange: {
      id: faker.datatype.uuid(),
      absolute: Amounts.sm,
      percentage: Amounts.xs,
    },
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
