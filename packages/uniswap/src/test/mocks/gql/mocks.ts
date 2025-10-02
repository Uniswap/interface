import { GraphQLApi } from '@universe/api'
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { GQL_CHAINS } from 'uniswap/src/test/fixtures'
import { faker, MAX_FIXTURE_TIMESTAMP } from 'uniswap/src/test/shared'
import { randomChoice, randomEnumValue } from 'uniswap/src/test/utils'

export const mocks = {
  TokenProject: {
    id: () => faker.datatype.uuid(),
    description: () => faker.lorem.sentence(),
    logoUrl: () => faker.image.imageUrl(),
    name: () => faker.lorem.word(),
    safetyLevel: () => GraphQLApi.SafetyLevel.Verified,
    tokens: () => new Array(4),
    markets: () => null,
  },
  TokenProjectMarket: {
    currency: () => GraphQLApi.Currency.Eth,
    id: () => faker.datatype.uuid(),
    tokenProject: () => ({ id: faker.datatype.uuid(), tokens: [] }),
    priceHistory: () => new Array(2),
  },
  Token: {
    id: () => faker.datatype.uuid(),
    address: () => null,
    chain: () => randomChoice(GQL_CHAINS),
    decimals: () => 6,
    symbol: () => faker.lorem.word(),
    protectionInfo: () => ({ result: randomEnumValue(GraphQLApi.ProtectionResult), attackTypes: [] }),
    feeData: () => ({ buyFeeBps: '', sellFeeBps: '' }),
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
    status: () => randomEnumValue(GraphQLApi.TransactionStatus),
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
    status: () => randomEnumValue(GraphQLApi.SwapOrderStatus),
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
