import { useMemo } from 'react'
import { RootState } from 'src/app/rootReducer'
import { SearchableRecipient } from 'src/components/RecipientSelect/types'
import { uniqueAddressesOnly } from 'src/components/RecipientSelect/utils'
import { ChainId } from 'src/constants/chains'
import {
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { flattenObjectOfObjects } from 'src/utils/objects'

export const makeSelectAddressTransactions = (address: Address | null) => (state: RootState) =>
  useMemo(() => {
    if (!address || !state.transactions[address]) return undefined
    return flattenObjectOfObjects(state.transactions[address])
  }, [state.transactions])

export const makeSelectTransaction =
  (address: Address | null, chainId: ChainId | undefined, txHash: string | undefined) =>
  (state: RootState) =>
    useMemo(() => {
      if (!address || !state.transactions[address] || !chainId || !txHash) return undefined
      const transactions = state.transactions[address]?.[chainId]
      if (!transactions) return undefined
      return Object.values(transactions).find(
        (txDetails) => txDetails.hash.toLowerCase() === txHash.toLowerCase()
      )
    }, [state.transactions])

// Returns a list of past recipients ordered from most to least recent
// TODO: either revert this to return addresses or keep but also return
//     displayName so that it's searchable for RecipientSelect
export const selectRecipientsByRecency = (state: RootState) => {
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

export const selectIncompleteTransactions = (state: RootState) => {
  const transactionsByChainId = flattenObjectOfObjects(state.transactions)
  return transactionsByChainId.reduce<TransactionDetails[]>((accum, transactions) => {
    const pendingTxs = Object.values(transactions).filter(
      (tx) => Boolean(!tx.receipt) && tx.status !== TransactionStatus.Failed
    )
    return [...accum, ...pendingTxs]
  }, [])
}

export const selectTransactionCount = (state: RootState) => {
  const transactionsByChainId = flattenObjectOfObjects(state.transactions)
  return transactionsByChainId.reduce<number>((sum, transactions) => {
    return (sum += Object.keys(transactions).length)
  }, 0)
}
