import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'src/app/rootReducer'
import { SearchableRecipient } from 'src/components/RecipientSelect/types'
import { uniqueAddressesOnly } from 'src/components/RecipientSelect/utils'
import { ChainId } from 'src/constants/chains'
import { TransactionState } from 'src/features/transactions/slice'
import {
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { unique } from 'src/utils/array'
import { flattenObjectOfObjects } from 'src/utils/objects'

export const selectTransactions = (state: RootState): TransactionState => state.transactions

// TODO(MOB-3968): Add more specific type definition here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeSelectAddressTransactions = (address: Address | null): any =>
  createSelector(selectTransactions, (transactions) => {
    if (!address) return undefined
    const addressTransactions = transactions[address]
    if (!addressTransactions) return undefined

    return unique(flattenObjectOfObjects(addressTransactions), (tx, _, self) => {
      // Remove dummy fiat onramp transactions from TransactionList, notification badge, etc.
      if (tx.typeInfo.type === TransactionType.FiatPurchase && !tx.typeInfo.syncedWithBackend) {
        return false
      }
      /*
       * Remove duplicate transactions with the same chain and nonce, keep the one with the higher addedTime,
       * this represents a txn that is replacing or cancelling the older txn.
       */
      const duplicate = self.find(
        (tx2) =>
          tx2.id !== tx.id &&
          tx2.options.request.chainId === tx.options.request.chainId &&
          tx2.options.request.nonce === tx.options.request.nonce
      )
      if (duplicate) {
        return tx.addedTime > duplicate.addedTime
      }
      return true
    })
  })

export const makeSelectTransaction = (
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any =>
  createSelector(selectTransactions, (transactions) => {
    if (!address || !transactions[address] || !chainId || !txId) {
      return undefined
    }

    const addressTxs = transactions[address]?.[chainId]
    if (!addressTxs) {
      return undefined
    }

    return Object.values(addressTxs).find((txDetails) => txDetails.id === txId)
  })

// Returns a list of past recipients ordered from most to least recent
// TODO: [MOB-3899] either revert this to return addresses or keep but also return displayName so that it's searchable for RecipientSelect
export const selectRecipientsByRecency = (state: RootState): SearchableRecipient[] => {
  const transactionsByChainId = flattenObjectOfObjects(state.transactions)
  const sendTransactions = transactionsByChainId.reduce<TransactionDetails[]>(
    (accum, transactions) => {
      const sendTransactionsWithRecipients = Object.values(transactions).filter(
        (tx) => tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient
      )
      return [...accum, ...sendTransactionsWithRecipients]
    },
    []
  )
  const sortedRecipients = sendTransactions
    .sort((a, b) => (a.addedTime < b.addedTime ? 1 : -1))
    .map((transaction) => {
      return {
        address: (transaction.typeInfo as SendTokenTransactionInfo)?.recipient,
        name: '',
      } as SearchableRecipient
    })
  return uniqueAddressesOnly(sortedRecipients)
}

export const selectIncompleteTransactions = (state: RootState): TransactionDetails[] => {
  const transactionsByChainId = flattenObjectOfObjects(state.transactions)
  return transactionsByChainId.reduce<TransactionDetails[]>((accum, transactions) => {
    const pendingTxs = Object.values(transactions).filter(
      (tx) => Boolean(!tx.receipt) && tx.status !== TransactionStatus.Failed
    )
    return [...accum, ...pendingTxs]
  }, [])
}
