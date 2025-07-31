import { createSelector, Selector } from '@reduxjs/toolkit'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { SearchableRecipient } from 'uniswap/src/features/address/types'
import { uniqueAddressesOnly } from 'uniswap/src/features/address/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionsState } from 'uniswap/src/features/transactions/slice'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'
import { selectTokensVisibility } from 'uniswap/src/features/visibility/selectors'
import { CurrencyIdToVisibility } from 'uniswap/src/features/visibility/slice'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { unique } from 'utilities/src/primitives/array'
import { flattenObjectOfObjects } from 'utilities/src/primitives/objects'

export const selectTransactions = (state: UniswapState): TransactionsState => state.transactions

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

export type AddressTransactionsSelector = Selector<UniswapState, TransactionDetails[] | undefined, [Address | null]>
export const makeSelectAddressTransactions = (): AddressTransactionsSelector =>
  createSelector(
    selectTransactions,
    (_: UniswapState, address: Address | null) => address,
    (transactions, address) => {
      if (!address) {
        return undefined
      }

      const addressTransactions = transactions[address]
      if (!addressTransactions) {
        return undefined
      }

      // eslint-disable-next-line max-params
      return unique(flattenObjectOfObjects(addressTransactions), (tx, _, self) => {
        // Remove dummy local FOR transactions from TransactionList, notification badge, etc.
        // this is what prevents the local transactions from actually appearing in the activity tab.
        if (tx.typeInfo.type === TransactionType.LocalOnRamp || tx.typeInfo.type === TransactionType.LocalOffRamp) {
          return false
        }
        /*
         * Remove duplicate transactions with the same chain and nonce, keep the one with the higher addedTime,
         * this represents a txn that is replacing or cancelling the older txn.
         */
        const duplicate = self.find(
          (tx2) =>
            tx2.id !== tx.id &&
            (isClassic(tx) || isBridge(tx)) &&
            (isClassic(tx2) || isBridge(tx2)) &&
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
  return useSelector((state: UniswapState) => selectAddressTransactions(state, address))
}

export function useCurrencyIdToVisibility(addresses: Address[]): CurrencyIdToVisibility {
  const manuallySetTokenVisibility = useSelector(selectTokensVisibility)
  const selectLocalTxCurrencyIds: (state: UniswapState, addresses: Address[]) => CurrencyIdToVisibility = useMemo(
    makeSelectTokenVisibilityFromLocalTxs,
    [],
  )

  const tokenVisibilityFromLocalTxs = useSelector((state: UniswapState) => selectLocalTxCurrencyIds(state, addresses))

  return useMemo(
    () => ({
      ...tokenVisibilityFromLocalTxs,
      // Tokens the user has individually shown/hidden in the app should take preference over local txs
      ...manuallySetTokenVisibility,
    }),
    [manuallySetTokenVisibility, tokenVisibilityFromLocalTxs],
  )
}

const makeSelectTokenVisibilityFromLocalTxs = (): Selector<UniswapState, CurrencyIdToVisibility, [Address[]]> =>
  createSelector(
    selectTransactions,
    (_: UniswapState, addresses: Address[]) => addresses,
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
  chainId: UniverseChainId | undefined
  txId: string | undefined
}

export const makeSelectTransaction = (): Selector<UniswapState, TransactionDetails | undefined, [MakeSelectParams]> =>
  createSelector(
    selectTransactions,
    (_: UniswapState, { address, chainId, txId }: MakeSelectParams) => ({
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
  UniswapState,
  UniswapXOrderDetails | undefined,
  [MakeSelectOrderParams]
> =>
  createSelector(
    selectTransactions,
    (_: UniswapState, { orderHash }: MakeSelectOrderParams) => ({ orderHash }),
    (transactions, { orderHash }): UniswapXOrderDetails | undefined => {
      for (const transactionsForChain of flattenObjectOfObjects(transactions)) {
        for (const tx of Object.values(transactionsForChain)) {
          if (isUniswapX(tx) && tx.orderHash === orderHash) {
            return tx
          }
        }
      }
      return undefined
    },
  )

// Returns a list of past recipients ordered from most to least recent
// TODO: [MOB-232] either revert this to return addresses or keep but also return displayName so that it's searchable for RecipientSelect
export const selectRecipientsByRecency = (state: UniswapState): SearchableRecipient[] => {
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
        address: (transaction.typeInfo as SendTokenTransactionInfo).recipient,
        name: '',
      } as SearchableRecipient
    })
  return uniqueAddressesOnly(sortedRecipients)
}

export const selectIncompleteTransactions = (state: UniswapState): TransactionDetails[] => {
  const transactionsByChainId = flattenObjectOfObjects(state.transactions)
  return transactionsByChainId.reduce<TransactionDetails[]>((accum, transactions) => {
    const pendingTxs = Object.values(transactions)
      .filter((tx) => {
        // Check if receipt property exists before accessing it
        return !('receipt' in tx) || !tx.receipt
      })
      .filter((tx) => !isFinalizedTx(tx))
    return [...accum, ...pendingTxs]
  }, [])
}
