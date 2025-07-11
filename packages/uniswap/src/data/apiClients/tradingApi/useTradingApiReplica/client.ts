import { createPublicClient, defineTransaction, defineTransactionRequest, http } from 'viem'
import { publicActionsL1 } from 'viem/zksync'
import { chainInfo } from './constants'

export const client = createPublicClient({
  chain: {
    ...chainInfo,
    formatters: {
      transaction: defineTransaction({
        exclude: ['type', 'gas'],
        format: (args) => ({
          gasLimit: args.gas,
        }),
      }),
      transactionRequest: defineTransactionRequest({
        exclude: ['type', 'gas'],
        format: (args) => ({
          gasLimit: args.gas,
        }),
      }),
    },
  },
  transport: http(),
}).extend(publicActionsL1())
