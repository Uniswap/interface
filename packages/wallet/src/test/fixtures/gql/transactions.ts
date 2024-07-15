import {
  AssetChange,
  Transaction,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { faker } from 'wallet/src/test/shared'
import { createFixture, randomEnumValue } from 'wallet/src/test/utils'

export const gqlTransaction = createFixture<Transaction>()(() => ({
  __typename: 'Transaction',
  id: faker.datatype.uuid(),
  hash: faker.datatype.uuid(),
  blockNumber: faker.datatype.number(),
  from: faker.finance.ethereumAddress(),
  to: faker.finance.ethereumAddress(),
  nonce: faker.datatype.number(),
  status: randomEnumValue(TransactionStatus),
}))

type TransactionDetailsBaseOptions = {
  transactionStatus: TransactionStatus
}

export const gqlTransactionDetails = createFixture<
  TransactionDetails,
  TransactionDetailsBaseOptions
>({
  transactionStatus: randomEnumValue(TransactionStatus),
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
  type: randomEnumValue(TransactionType),
  assetChanges: [] as AssetChange[],
}))
