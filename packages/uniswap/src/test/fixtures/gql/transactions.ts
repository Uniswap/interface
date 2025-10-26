import { GraphQLApi } from '@universe/api'
import { faker } from 'uniswap/src/test/shared'
import { createFixture, randomEnumValue } from 'uniswap/src/test/utils'

export const gqlTransaction = createFixture<GraphQLApi.Transaction>()(() => ({
  __typename: 'Transaction',
  id: faker.datatype.uuid(),
  hash: faker.datatype.uuid(),
  blockNumber: faker.datatype.number(),
  from: faker.finance.ethereumAddress(),
  to: faker.finance.ethereumAddress(),
  nonce: faker.datatype.number(),
  status: randomEnumValue(GraphQLApi.TransactionStatus),
}))

type TransactionDetailsBaseOptions = {
  transactionStatus: GraphQLApi.TransactionStatus
}

export const gqlTransactionDetails = createFixture<GraphQLApi.TransactionDetails, TransactionDetailsBaseOptions>({
  transactionStatus: randomEnumValue(GraphQLApi.TransactionStatus),
})(({ transactionStatus }) => ({
  __typename: 'TransactionDetails',
  id: faker.datatype.uuid(),
  hash: faker.datatype.uuid(),
  from: faker.finance.ethereumAddress(),
  to: faker.finance.ethereumAddress(),
  nonce: faker.datatype.number(),
  /** @deprecated use transactionStatus to disambiguate from swapOrderStatus */
  status: transactionStatus,
  transactionStatus,
  type: randomEnumValue(GraphQLApi.TransactionType),
  assetChanges: [] as GraphQLApi.AssetChange[],
}))
