import {
  TransactionReceipt,
  TransactionRequest,
  TransactionResponse,
} from '@ethersproject/providers'
import { BigNumber, Transaction } from 'ethers'
import { faker } from 'wallet/src/test/shared'
import { createFixture } from 'wallet/src/test/utils'

export const ethersTransaction = createFixture<Transaction>()(() => ({
  chainId: faker.datatype.number(),
  data: faker.datatype.uuid(),
  nonce: faker.datatype.number(),
  gasLimit: BigNumber.from(faker.datatype.number()),
  value: BigNumber.from(faker.datatype.number()),
}))

export const ethersTransactionReceipt = createFixture<TransactionReceipt>()(() => ({
  to: faker.finance.ethereumAddress(),
  from: faker.finance.ethereumAddress(),
  contractAddress: faker.finance.ethereumAddress(),
  transactionIndex: faker.datatype.number(),
  gasUsed: BigNumber.from(faker.datatype.number()),
  logsBloom: faker.datatype.uuid(),
  blockHash: faker.datatype.uuid(),
  transactionHash: faker.datatype.uuid(),
  logs: [],
  blockNumber: faker.datatype.number(),
  confirmations: faker.datatype.number(),
  cumulativeGasUsed: BigNumber.from(faker.datatype.number()),
  effectiveGasPrice: BigNumber.from(faker.datatype.number()),
  byzantium: faker.datatype.boolean(),
  type: faker.datatype.number(),
}))

export const ethersTransactionRequest = createFixture<TransactionRequest>()(() => ({
  from: faker.finance.ethereumAddress(),
  to: faker.finance.ethereumAddress(),
  value: faker.datatype.number().toString(),
  data: faker.datatype.uuid(),
  nonce: BigNumber.from(faker.datatype.number()),
  gasPrice: faker.datatype.number().toString(),
}))

export const ethersTransactionResponse = createFixture<TransactionResponse>()(() => ({
  ...ethersTransaction(),
  hash: faker.datatype.uuid(),
  confirmations: faker.datatype.number(),
  from: faker.finance.ethereumAddress(),
  wait: (): Promise<TransactionReceipt> => Promise.resolve(ethersTransactionReceipt()),
}))
