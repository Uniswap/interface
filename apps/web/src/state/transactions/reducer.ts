import { createSlice } from '@reduxjs/toolkit'
import {
  PendingTransactionDetails,
  TransactionDetails,
  TransactionInfo,
  TransactionType,
} from 'state/transactions/types'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// TODO(WEB-2053): update this to be a map of account -> chainId -> txHash -> TransactionDetails
// to simplify usage, once we're able to invalidate localstorage
export interface LocalWebTransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

export const initialState: LocalWebTransactionState = {}

const localTransactionSlice = createSlice({
  name: 'localWebTransactions',
  initialState,
  reducers: {
    addTransaction(
      transactions,
      {
        payload: { chainId, hash, ...details },
      }: { payload: { chainId: UniverseChainId } & Omit<PendingTransactionDetails, 'status' | 'addedTime'> },
    ) {
      if (transactions[chainId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      const txs = transactions[chainId] ?? {}
      txs[hash] = {
        status: TransactionStatus.Pending,
        hash,
        addedTime: Date.now(),
        ...details,
      }
      transactions[chainId] = txs
    },
    clearAllTransactions(transactions, { payload: { chainId } }: { payload: { chainId: UniverseChainId } }) {
      if (!transactions[chainId]) {
        return
      }
      transactions[chainId] = {}
    },
    removeTransaction(
      transactions,
      { payload: { chainId, hash } }: { payload: { chainId: UniverseChainId; hash: string } },
    ) {
      if (transactions[chainId][hash]) {
        delete transactions[chainId][hash]
      }
    },
    checkedTransaction(
      transactions,
      {
        payload: { chainId, hash, blockNumber },
      }: { payload: { chainId: UniverseChainId; hash: string; blockNumber: number } },
    ) {
      const tx = transactions[chainId]?.[hash]
      if (!tx || tx.status !== TransactionStatus.Pending) {
        return
      }
      if (!tx.lastCheckedBlockNumber) {
        tx.lastCheckedBlockNumber = blockNumber
      } else {
        tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber)
      }
    },
    finalizeTransaction(
      transactions,
      {
        payload: { chainId, hash, status, info },
      }: {
        payload: {
          chainId: UniverseChainId
          hash: string
          status: TransactionStatus
          info?: TransactionInfo
        }
      },
    ) {
      const tx = transactions[chainId]?.[hash]
      if (!tx) {
        return
      }
      transactions[chainId][hash] = {
        ...tx,
        status,
        confirmedTime: Date.now(),
        info: info ?? tx.info,
      }
    },
    /* Marks a bridge tx as deposited, without setting it as confirmed in the UI. */
    confirmBridgeDeposit(
      transactions,
      {
        payload: { chainId, hash },
      }: {
        payload: {
          chainId: UniverseChainId
          hash: string
        }
      },
    ) {
      const tx = transactions[chainId]?.[hash]
      if (tx?.info.type !== TransactionType.BRIDGE) {
        return
      }
      tx.info.depositConfirmed = true
    },
    updateTransactionInfo(
      transactions,
      {
        payload: { chainId, hash, info },
      }: {
        payload: {
          chainId: UniverseChainId
          hash: string
          info: TransactionInfo
        }
      },
    ) {
      const tx = transactions[chainId]?.[hash]
      if (!tx || tx.info.type !== info.type) {
        return
      }

      tx.info = info
    },
    cancelTransaction(
      transactions,
      {
        payload: { chainId, hash, cancelHash },
      }: { payload: { chainId: UniverseChainId; hash: string; cancelHash: string } },
    ) {
      const tx = transactions[chainId]?.[hash]

      if (tx) {
        delete transactions[chainId]?.[hash]
        transactions[chainId][cancelHash] = {
          ...tx,
          hash: cancelHash,
          cancelled: true,
        }
      }
    },
  },
})

export const {
  addTransaction,
  updateTransactionInfo,
  clearAllTransactions,
  checkedTransaction,
  finalizeTransaction,
  removeTransaction,
  cancelTransaction,
  confirmBridgeDeposit,
} = localTransactionSlice.actions
export default localTransactionSlice.reducer
