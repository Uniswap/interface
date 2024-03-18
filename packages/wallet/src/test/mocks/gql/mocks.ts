/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Currency,
  SafetyLevel,
  SwapOrderStatus,
  TransactionStatus,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GQL_CHAINS } from 'wallet/src/test/fixtures'
import { MAX_FIXTURE_TIMESTAMP, faker } from 'wallet/src/test/shared'
import { randomChoice, randomEnumValue } from 'wallet/src/test/utils'

export const mocks = {
  TokenProject: {
    id: () => faker.datatype.uuid(),
    description: () => faker.lorem.sentence(),
    logoUrl: () => faker.image.imageUrl(),
    name: () => faker.lorem.word(),
    safetyLevel: () => SafetyLevel.Verified,
    tokens: () => new Array(4),
  },
  TokenProjectMarket: {
    currency: () => Currency.Eth,
    id: () => faker.datatype.uuid(),
    tokenProject: () => ({ id: faker.datatype.uuid(), tokens: [] }),
    priceHistory: () => new Array(2),
  },
  Token: {
    id: () => faker.datatype.uuid(),
    address: () => faker.finance.ethereumAddress(),
    chain: () => randomChoice(GQL_CHAINS),
    decimals: () => 6,
    symbol: () => faker.lorem.word(),
  },
  Amount: {
    id: () => faker.datatype.uuid(),
    value: () => faker.datatype.number(),
  },
  AmountChange: {
    id: () => faker.datatype.uuid(),
  },
  TimestampedAmount: {
    id: () => faker.datatype.uuid(),
    timestamp: () => faker.date.past(/*year=*/ 2).getMilliseconds(),
    value: () => Number(faker.random.numeric(10)),
  },
  Portfolio: {
    id: () => faker.datatype.uuid(),
    ownerAddress: () => faker.finance.ethereumAddress(),
  },
  AssetActivity: {
    timestamp: () => faker.datatype.number({ max: MAX_FIXTURE_TIMESTAMP }),
    chain: () => randomChoice(GQL_CHAINS),
  },
  TransactionDetails: {
    id: () => faker.datatype.uuid(),
    status: () => randomEnumValue(TransactionStatus),
    to: () => faker.finance.ethereumAddress(),
    from: () => faker.finance.ethereumAddress(),
    nonce: () => faker.datatype.number(),
    assetChanges: () => new Array(1),
    hash: () => faker.datatype.uuid(),
  },
  SwapOrderDetails: {
    id: () => faker.datatype.uuid(),
    offerer: () => faker.finance.ethereumAddress(),
    hash: () => faker.datatype.uuid(),
    status: () => randomEnumValue(SwapOrderStatus),
  },
  ApplicationContract: {
    id: () => faker.datatype.uuid(),
    chain: () => randomChoice(GQL_CHAINS),
    address: () => faker.finance.ethereumAddress(),
  },
  NftCollection: {
    id: () => faker.datatype.uuid(),
    name: () => faker.lorem.word(),
    collectionId: () => faker.datatype.uuid(),
    isVerified: () => true,
    nftContracts: () => new Array(1),
  },
  NftContract: {
    id: () => faker.datatype.uuid(),
    chain: () => randomChoice(GQL_CHAINS),
    address: () => faker.finance.ethereumAddress(),
  },
  Image: {
    id: () => faker.datatype.uuid(),
    url: () => faker.image.imageUrl(),
  },
} as const
