import { UniverseChainId } from '@universe/chains'
import { PersistState } from 'redux-persist'
import type { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { createPersistState, createSafeMigration } from 'uniswap/src/state/createSafeMigration'

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

// Frozen copy of the persisted status strings this migration wrote; must never change.
type PersistedTransactionStatus = 'CONFIRMED' | 'FAILED' | 'PENDING'

interface BaseTransactionDetails {
  status: PersistedTransactionStatus
  hash: string
  batchInfo?: { connectorId?: string; batchId: string; chainId: UniverseChainId }
  addedTime: number
  from: string
  info: TransactionTypeInfo
  nonce?: number
  cancelled?: true
}

interface PendingTransactionDetails extends BaseTransactionDetails {
  status: 'PENDING'
  lastCheckedBlockNumber?: number
  deadline?: number
}

interface ConfirmedTransactionDetails extends BaseTransactionDetails {
  status: 'CONFIRMED' | 'FAILED'
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

    // oxlint-disable-next-line guard-for-in
    for (const chainId in state.transactions) {
      const transactionsForChain = state.transactions[chainId]
      // oxlint-disable-next-line guard-for-in
      for (const txHash in transactionsForChain) {
        const { receipt, ...tx } = transactionsForChain[txHash]

        const status: PersistedTransactionStatus = receipt ? (receipt.status === 1 ? 'CONFIRMED' : 'FAILED') : 'PENDING'

        ;(tx as unknown as { status: PersistedTransactionStatus }).status = status

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
