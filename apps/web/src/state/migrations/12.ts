import { PersistState } from 'redux-persist'
import { TransactionDetails } from 'state/transactions/types'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

interface SerializableTransactionReceipt {
  to: string
  from: string
  contractAddress: string
  transactionIndex: number
  blockHash: string
  transactionHash: string
  blockNumber: number
  status?: number
}

export interface OldTransactionState {
  [chainId: number]: {
    [txHash: string]: Omit<TransactionDetails, 'status'> & {
      receipt?: SerializableTransactionReceipt
      lastCheckedBlockNumber?: number
      confirmedTime?: number
      deadline?: number
    }
  }
}

export type PersistAppStateV12 = {
  _persist: PersistState
} & { transactions?: OldTransactionState }

/**
 * Migration for the change that refactored TransactionDetails into a union discriminated by `status` and removed `receipt`.
 */
export const migration12 = (state: PersistAppStateV12 | undefined) => {
  if (!state?.transactions) {
    return state
  }

  // eslint-disable-next-line guard-for-in
  for (const chainId in state.transactions) {
    const transactionsForChain = state.transactions[chainId]
    // eslint-disable-next-line guard-for-in
    for (const txHash in transactionsForChain) {
      const { receipt, ...tx } = transactionsForChain[txHash]

      const status = receipt
        ? receipt.status === 1
          ? TransactionStatus.Confirmed
          : TransactionStatus.Failed
        : TransactionStatus.Pending

      ;(tx as TransactionDetails).status = status

      transactionsForChain[txHash] = tx
    }
  }

  return { ...state, _persist: { ...state._persist, version: 12 } }
}
