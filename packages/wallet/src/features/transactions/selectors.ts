import { createSelector, Selector } from '@reduxjs/toolkit'
import { useMemo } from 'react'
import { unique } from 'utilities/src/primitives/array'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { ChainId } from 'wallet/src/constants/chains'
import { SearchableRecipient } from 'wallet/src/features/address/types'
import { uniqueAddressesOnly } from 'wallet/src/features/address/utils'
import { selectTokensVisibility } from 'wallet/src/features/favorites/selectors'
import { AccountToTokenVisibility, TokenVisibility } from 'wallet/src/features/favorites/slice'
import { TransactionStateMap } from 'wallet/src/features/transactions/slice'
import {
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { RootState, useAppSelector } from 'wallet/src/state'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

export const selectTransactions = (state: RootState): TransactionStateMap => state.transactions

export const selectSwapTransactionsCount = createSelector(selectTransactions, (transactions) => {
  let swapTransactionCount = 0
  const txs = flattenObjectOfObjects(transactions)
  for (const tx of txs) {
    for (const transaction of Object.values(tx)) {
      if (transaction.typeInfo.type === TransactionType.Swap) {
        swapTransactionCount++
      }
    }
  }
  return swapTransactionCount
})

export const makeSelectAddressTransactions = (): Selector<
  RootState,
  TransactionDetails[] | undefined,
  [Address | null]
> =>
  createSelector(
    selectTransactions,
    (_: RootState, address: Address | null) => address,
    (transactions, address) => {
      if (!address) {
        return
      }

      const addressTransactions = transactions[address]
      if (!addressTransactions) {
        return
      }

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
            tx2.options.request.chainId &&
            tx2.options.request.chainId === tx.options.request.chainId &&
            tx.options.request.nonce &&
            tx2.options.request.nonce === tx.options.request.nonce
        )
        if (duplicate) {
          return tx.addedTime > duplicate.addedTime
        }
        return true
      })
    }
  )

export function useSelectAddressTransactions(
  address: Address | null
): TransactionDetails[] | undefined {
  const selectAddressTransactions = useMemo(makeSelectAddressTransactions, [])
  return useAppSelector((state) => selectAddressTransactions(state, address))
}

export function useAccountToTokenVisibility(addresses: Address[]): AccountToTokenVisibility {
  const accountToTokenVisibilityFromUserSettings = useAppSelector(selectTokensVisibility)
  const selectLocalTxCurrencyIds: (
    state: RootState,
    addresses: Address[]
  ) => AccountToTokenVisibility = useMemo(makeSelectTokenVisibilityFromLocalTxs, [])
  const accountToTokenVisibilityFromLocalTxs = useAppSelector((state) =>
    selectLocalTxCurrencyIds(state, addresses)
  )
  return {
    ...accountToTokenVisibilityFromLocalTxs,
    // User settings has higher priority and overrides items from local txs
    ...accountToTokenVisibilityFromUserSettings,
  }
}

export const makeSelectTokenVisibilityFromLocalTxs = (): Selector<
  RootState,
  AccountToTokenVisibility,
  [Address[]]
> =>
  createSelector(
    selectTransactions,
    (_: RootState, addresses: Address[]) => addresses,
    (transactions, addresses) => {
      return addresses.reduce<AccountToTokenVisibility>((addressAcc, address) => {
        const addressTransactions = address && transactions[address]
        if (!addressTransactions) {
          return addressAcc
        }

        addressAcc[address] = flattenObjectOfObjects(addressTransactions).reduce<
          Record<string, TokenVisibility>
        >((txAcc, tx) => {
          if (tx.typeInfo.type === TransactionType.Send) {
            txAcc[buildCurrencyId(tx.chainId, tx.typeInfo.tokenAddress.toLowerCase())] = {
              isVisible: true,
            }
          } else if (tx.typeInfo.type === TransactionType.Swap) {
            txAcc[tx.typeInfo.inputCurrencyId.toLowerCase()] = { isVisible: true }
            txAcc[tx.typeInfo.outputCurrencyId.toLowerCase()] = { isVisible: true }
          }
          return txAcc
        }, {})

        return addressAcc
      }, {})
    }
  )

interface MakeSelectParams {
  address: Address | undefined
  chainId: ChainId | undefined
  txId: string | undefined
}

export const makeSelectTransaction = (): Selector<
  RootState,
  TransactionDetails | undefined,
  [MakeSelectParams]
> =>
  createSelector(
    selectTransactions,
    (_: RootState, { address, chainId, txId }: MakeSelectParams) => ({
      address,
      chainId,
      txId,
    }),
    (transactions, { address, chainId, txId }): TransactionDetails | undefined => {
      if (!address || !transactions[address] || !chainId || !txId) {
        return undefined
      }

      const addressTxs = transactions[address]?.[chainId]
      if (!addressTxs) {
        return undefined
      }

      return Object.values(addressTxs).find((txDetails) => txDetails.id === txId)
    }
  )

// Returns a list of past recipients ordered from most to least recent
// TODO: [MOB-232] either revert this to return addresses or keep but also return displayName so that it's searchable for RecipientSelect
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
      (tx) =>
        Boolean(!tx.receipt) &&
        tx.status !== TransactionStatus.Failed &&
        tx.status !== TransactionStatus.Success
    )
    return [...accum, ...pendingTxs]
  }, [])
}
