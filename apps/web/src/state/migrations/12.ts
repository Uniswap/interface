import { GraphQLApi } from '@universe/api'
import { PersistState } from 'redux-persist'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createPersistState, createSafeMigration } from 'uniswap/src/state/createSafeMigration'
import { TransactionInfo } from '~/state/transactions/types'

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

interface BaseTransactionDetails {
  status: GraphQLApi.TransactionStatus
  hash: string
  batchInfo?: { connectorId?: string; batchId: string; chainId: UniverseChainId }
  addedTime: number
  from: string
  info: TransactionInfo
  nonce?: number
  cancelled?: true
}

interface PendingTransactionDetails extends BaseTransactionDetails {
  status: GraphQLApi.TransactionStatus.Pending
  lastCheckedBlockNumber?: number
  deadline?: number
}

interface ConfirmedTransactionDetails extends BaseTransactionDetails {
  status: GraphQLApi.TransactionStatus.Confirmed | GraphQLApi.TransactionStatus.Failed
  confirmedTime: number
}

type TransactionDetails = PendingTransactionDetails | ConfirmedTransactionDetails

export interface NewTransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

export type PersistAppStateV12 = {
  _persist: PersistState
} & { transactions?: OldTransactionState }

/**
 * Migration for the change that refactored TransactionDetails into a union discriminated by `status` and removed `receipt`.
 */
export const migration12 = createSafeMigration({
  filename: '12.ts',
  name: 'migration12',
  migrate: (state: PersistAppStateV12 | undefined) => {
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
            ? GraphQLApi.TransactionStatus.Confirmed
            : GraphQLApi.TransactionStatus.Failed
          : GraphQLApi.TransactionStatus.Pending

        ;(tx as unknown as { status: GraphQLApi.TransactionStatus }).status = status

        transactionsForChain[txHash] = tx
      }
    }

    return { ...state, _persist: { ...state._persist, version: 12 } }
  },
  onError: (state: PersistAppStateV12 | undefined) => ({
    ...state,
    transactions: {},
    _persist: createPersistState(state, 12),
  }),
})
