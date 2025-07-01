import { createPublicClient, defineTransaction, defineTransactionRequest, http } from 'viem'
import { publicActionsL1 } from 'viem/zksync'
import { chainInfo } from './constants'

export const client = createPublicClient({
  chain: {
    ...chainInfo,
    formatters: {
      transaction: defineTransaction({
        exclude: ['type'],
        format: () => {},
      }),
      transactionRequest: defineTransactionRequest({
        exclude: ['type'],
        format: () => {},
      }),
    },
  },
  transport: http(),
}).extend(publicActionsL1())
