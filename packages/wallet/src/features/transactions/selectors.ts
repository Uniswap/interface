import { createSelector, Selector } from '@reduxjs/toolkit'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectTokensVisibility } from 'uniswap/src/features/favorites/selectors'
import { CurrencyIdToVisibility } from 'uniswap/src/features/favorites/slice'
import { TransactionsState } from 'uniswap/src/features/transactions/slice'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  isFinalizedTx,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { WalletChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { unique } from 'utilities/src/primitives/array'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'
import { SearchableRecipient } from 'wallet/src/features/address/types'
import { uniqueAddressesOnly } from 'wallet/src/features/address/utils'
import { useAccounts } from 'wallet/src/features/wallet/hooks'
import { WalletState } from 'wallet/src/state/walletReducer'

export const selectTransactions = (state: WalletState): TransactionsState => state.transactions

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
  WalletState,
  TransactionDetails[] | undefined,
  [Address | null]
> =>
  createSelector(
    selectTransactions,
    (_: WalletState, address: Address | null) => address,
    (transactions, address) => {
      if (!address) {
        return
      }

      const addressTransactions = transactions[address]
      if (!addressTransactions) {
        return
      }

      return unique(flattenObjectOfObjects(addressTransactions), (tx, _, self) => {
        // Remove dummy local onramp transactions from TransactionList, notification badge, etc.
        if (tx.typeInfo.type === TransactionType.LocalOnRamp) {
          return false
        }
        /*
         * Remove duplicate transactions with the same chain and nonce, keep the one with the higher addedTime,
         * this represents a txn that is replacing or cancelling the older txn.
         */
        const duplicate = self.find(
          (tx2) =>
            tx2.id !== tx.id &&
            isClassic(tx) &&
            isClassic(tx2) &&
            tx2.options.request.chainId &&
            tx2.options.request.chainId === tx.options.request.chainId &&
            tx.options.request.nonce &&
            tx2.options.request.nonce === tx.options.request.nonce,
        )
        if (duplicate) {
          return tx.addedTime > duplicate.addedTime
        }
        return true
      })
    },
  )

export function useSelectAddressTransactions(address: Address | null): TransactionDetails[] | undefined {
  const selectAddressTransactions = useMemo(makeSelectAddressTransactions, [])
  return useSelector((state: WalletState) => selectAddressTransactions(state, address))
}

export function useCurrencyIdToVisibility(): CurrencyIdToVisibility {
  const accounts = useAccounts()
  const addresses = Object.values(accounts).map((account) => account.address)
  const manuallySetTokenVisibility = useSelector(selectTokensVisibility)
  const selectLocalTxCurrencyIds: (state: WalletState, addresses: Address[]) => CurrencyIdToVisibility = useMemo(
    makeSelectTokenVisibilityFromLocalTxs,
    [],
  )

  const tokenVisibilityFromLocalTxs = useSelector((state: WalletState) => selectLocalTxCurrencyIds(state, addresses))

  return {
    ...tokenVisibilityFromLocalTxs,
    // Tokens the user has individually shown/hidden in the app should take preference over local txs
    ...manuallySetTokenVisibility,
  }
}

const makeSelectTokenVisibilityFromLocalTxs = (): Selector<WalletState, CurrencyIdToVisibility, [Address[]]> =>
  createSelector(
    selectTransactions,
    (_: WalletState, addresses: Address[]) => addresses,
    (transactions, addresses) =>
      addresses.reduce<CurrencyIdToVisibility>((acc, address) => {
        const addressTransactions = transactions[address]
        if (!addressTransactions) {
          return acc
        }

        Object.values(flattenObjectOfObjects(addressTransactions)).forEach((tx) => {
          if (tx.typeInfo.type === TransactionType.Send) {
            acc[buildCurrencyId(tx.chainId, tx.typeInfo.tokenAddress.toLowerCase())] = {
              isVisible: true,
            }
          } else if (tx.typeInfo.type === TransactionType.Swap) {
            acc[tx.typeInfo.inputCurrencyId.toLowerCase()] = { isVisible: true }
            acc[tx.typeInfo.outputCurrencyId.toLowerCase()] = { isVisible: true }
          }
        })

        return acc
      }, {}),
  )

interface MakeSelectParams {
  address: Address | undefined
  chainId: WalletChainId | undefined
  txId: string | undefined
}

export const makeSelectTransaction = (): Selector<WalletState, TransactionDetails | undefined, [MakeSelectParams]> =>
  createSelector(
    selectTransactions,
    (_: WalletState, { address, chainId, txId }: MakeSelectParams) => ({
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
    },
  )

interface MakeSelectOrderParams {
  orderHash: string
}

export const makeSelectUniswapXOrder = (): Selector<
  WalletState,
  UniswapXOrderDetails | undefined,
  [MakeSelectOrderParams]
> =>
  createSelector(
    selectTransactions,
    (_: WalletState, { orderHash }: MakeSelectOrderParams) => ({ orderHash }),
    (transactions, { orderHash }): UniswapXOrderDetails | undefined => {
      for (const transactionsForChain of flattenObjectOfObjects(transactions)) {
        for (const tx of Object.values(transactionsForChain)) {
          if (isUniswapX(tx) && tx.orderHash === orderHash) {
            return tx
          }
        }
      }
    },
  )
// Returns a list of past recipients ordered from most to least recent
// TODO: [MOB-232] either revert this to return addresses or keep but also return displayName so that it's searchable for RecipientSelect
export const selectRecipientsByRecency = (state: WalletState): SearchableRecipient[] => {
  const transactionsByChainId = flattenObjectOfObjects(state.transactions)
  const sendTransactions = transactionsByChainId.reduce<TransactionDetails[]>((accum, transactions) => {
    const sendTransactionsWithRecipients = Object.values(transactions).filter(
      (tx) => tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient,
    )
    return [...accum, ...sendTransactionsWithRecipients]
  }, [])
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

export const selectIncompleteTransactions = (state: WalletState): TransactionDetails[] => {
  const transactionsByChainId = flattenObjectOfObjects(state.transactions)
  return transactionsByChainId.reduce<TransactionDetails[]>((accum, transactions) => {
    const pendingTxs = Object.values(transactions).filter((tx) => Boolean(!tx.receipt) && !isFinalizedTx(tx))
    return [...accum, ...pendingTxs]
  }, [])
}
