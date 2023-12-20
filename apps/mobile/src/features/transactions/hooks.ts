import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import { BigNumberish } from 'ethers'
import { useCallback, useMemo } from 'react'
import { SearchContext } from 'src/components/explore/search/SearchContext'
import { flowToModalName } from 'src/components/TokenSelector/flowToModalName'
import { TokenSelectorFlow } from 'src/components/TokenSelector/types'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import {
  createSwapFormFromTxDetails,
  createWrapFormFromTxDetails,
} from 'src/features/transactions/swap/createSwapFormFromTxDetails'
import { transactionStateActions } from 'src/features/transactions/transactionState/transactionState'
import { logger } from 'utilities/src/logger/logger'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  makeSelectAddressTransactions,
  makeSelectLocalTxCurrencyIds,
  makeSelectTransaction,
} from 'wallet/src/features/transactions/selectors'
import { finalizeTransaction } from 'wallet/src/features/transactions/slice'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import {
  isFinalizedTx,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'
import { areCurrencyIdsEqual, buildCurrencyId, currencyAddress } from 'wallet/src/utils/currencyId'

export function usePendingTransactions(
  address: Address | null,
  ignoreTransactionTypes: TransactionType[] = []
): TransactionDetails[] | undefined {
  const transactions = useSelectAddressTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.filter(
      (tx: { status: TransactionStatus; typeInfo: { type: TransactionType } }) =>
        tx.status === TransactionStatus.Pending &&
        !ignoreTransactionTypes.includes(tx.typeInfo.type)
    )
  }, [ignoreTransactionTypes, transactions])
}

// sorted oldest to newest
export function useSortedPendingTransactions(
  address: Address | null
): TransactionDetails[] | undefined {
  const transactions = usePendingTransactions(address)
  return useMemo(() => {
    if (!transactions) return
    return transactions.sort(
      (a: TransactionDetails, b: TransactionDetails) => a.addedTime - b.addedTime
    )
  }, [transactions])
}

export function useSelectTransaction(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
): TransactionDetails | undefined {
  const selectTransaction = useMemo(makeSelectTransaction, [])
  return useAppSelector((state) => selectTransaction(state, { address, chainId, txId }))
}

export function useSelectAddressTransactions(
  address: Address | null
): TransactionDetails[] | undefined {
  const selectAddressTransactions = useMemo(makeSelectAddressTransactions, [])
  return useAppSelector((state) => selectAddressTransactions(state, address))
}

export function useSelectLocalTxCurrencyIds(address: Address | null): Record<string, boolean> {
  const selectLocalTxCurrencyIds = useMemo(makeSelectLocalTxCurrencyIds, [])
  return useAppSelector((state) => selectLocalTxCurrencyIds(state, address))
}

export function useCreateSwapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined
): TransactionState | undefined {
  const transaction = useSelectTransaction(address, chainId, txId)

  const inputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.inputCurrencyId
      : undefined

  const outputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap
      ? transaction.typeInfo.outputCurrencyId
      : undefined

  const inputCurrencyInfo = useCurrencyInfo(inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(outputCurrencyId)

  return useMemo(() => {
    if (!chainId || !txId || !transaction) {
      return undefined
    }

    return createSwapFormFromTxDetails({
      transactionDetails: transaction,
      inputCurrency: inputCurrencyInfo?.currency,
      outputCurrency: outputCurrencyInfo?.currency,
    })
  }, [chainId, inputCurrencyInfo, outputCurrencyInfo, transaction, txId])
}

export function useCreateWrapFormState(
  address: Address | undefined,
  chainId: ChainId | undefined,
  txId: string | undefined,
  inputCurrency: Maybe<Currency>,
  outputCurrency: Maybe<Currency>
): TransactionState | undefined {
  const transaction = useSelectTransaction(address, chainId, txId)

  return useMemo(() => {
    if (!chainId || !txId || !transaction) {
      return undefined
    }

    return createWrapFormFromTxDetails({
      transactionDetails: transaction,
      inputCurrency,
      outputCurrency,
    })
  }, [chainId, inputCurrency, outputCurrency, transaction, txId])
}

export function useTokenSelectorActionHandlers(
  dispatch: React.Dispatch<AnyAction>,
  flow: TokenSelectorFlow
): {
  onShowTokenSelector: (field: CurrencyField) => void
  onHideTokenSelector: () => void
  onSelectCurrency: (currency: Currency, field: CurrencyField, context: SearchContext) => void
} {
  const onShowTokenSelector = useCallback(
    (field: CurrencyField) => dispatch(transactionStateActions.showTokenSelector(field)),
    [dispatch]
  )

  const onHideTokenSelector = useCallback(
    () => dispatch(transactionStateActions.showTokenSelector(undefined)),
    [dispatch]
  )

  const onSelectCurrency = useCallback(
    (currency: Currency, field: CurrencyField, context: SearchContext) => {
      dispatch(
        transactionStateActions.selectCurrency({
          field,
          tradeableAsset: {
            address: currencyAddress(currency),
            chainId: currency.chainId,
            type: AssetType.Currency,
          },
        })
      )

      // log event that a currency was selected
      sendMobileAnalyticsEvent(MobileEventName.TokenSelected, {
        name: currency.name,
        address: currencyAddress(currency),
        chain: currency.chainId,
        modal: flowToModalName(flow),
        field,
        category: context.category,
        position: context.position,
        suggestion_count: context.suggestionCount,
        query: context.query,
      })

      // hide screen when done selecting
      onHideTokenSelector()
    },
    [dispatch, flow, onHideTokenSelector]
  )
  return { onSelectCurrency, onShowTokenSelector, onHideTokenSelector }
}

/** Set of handlers wrapping actions involving user input */
export function useTokenFormActionHandlers(dispatch: React.Dispatch<AnyAction>): {
  onCreateTxId: (txId: string) => void
  onFocusInput: () => void
  onFocusOutput: () => void
  onSwitchCurrencies: () => void
  onToggleFiatInput: (isFiatInput: boolean) => void
  onSetExactAmount: (field: CurrencyField, value: string, isFiatInput?: boolean) => void
  onSetMax: (amount: string) => void
} {
  const onUpdateExactTokenAmount = useCallback(
    (field: CurrencyField, amount: string) =>
      dispatch(transactionStateActions.updateExactAmountToken({ field, amount })),
    [dispatch]
  )

  const onUpdateExactUSDAmount = useCallback(
    (field: CurrencyField, amount: string) =>
      dispatch(transactionStateActions.updateExactAmountFiat({ field, amount })),
    [dispatch]
  )

  const onSetExactAmount = useCallback(
    (field: CurrencyField, value: string, isFiatInput?: boolean) => {
      const updater = isFiatInput ? onUpdateExactUSDAmount : onUpdateExactTokenAmount
      updater(field, value)
    },
    [onUpdateExactUSDAmount, onUpdateExactTokenAmount]
  )

  const onSetMax = useCallback(
    (amount: string) => {
      // when setting max amount, always switch to token mode because
      // our token/usd updater doesnt handle this case yet
      dispatch(transactionStateActions.toggleFiatInput(false))
      dispatch(
        transactionStateActions.updateExactAmountToken({ field: CurrencyField.INPUT, amount })
      )
      // Unfocus the CurrencyInputField by setting focusOnCurrencyField to null
      dispatch(transactionStateActions.onFocus(null))
    },
    [dispatch]
  )

  const onSwitchCurrencies = useCallback(() => {
    dispatch(transactionStateActions.switchCurrencySides())
  }, [dispatch])

  const onToggleFiatInput = useCallback(
    (isFiatInput: boolean) => dispatch(transactionStateActions.toggleFiatInput(isFiatInput)),
    [dispatch]
  )

  const onCreateTxId = useCallback(
    (txId: string) => dispatch(transactionStateActions.setTxId(txId)),
    [dispatch]
  )

  const onFocusInput = useCallback(
    () => dispatch(transactionStateActions.onFocus(CurrencyField.INPUT)),
    [dispatch]
  )
  const onFocusOutput = useCallback(
    () => dispatch(transactionStateActions.onFocus(CurrencyField.OUTPUT)),
    [dispatch]
  )
  return {
    onCreateTxId,
    onFocusInput,
    onFocusOutput,
    onSwitchCurrencies,
    onToggleFiatInput,
    onSetExactAmount,
    onSetMax,
  }
}

/**
 * Merge local and remote transactions. If duplicated hash found use data from local store.
 */
export function useMergeLocalAndRemoteTransactions(
  address: string,
  remoteTransactions: TransactionDetails[] | undefined
): TransactionDetails[] | undefined {
  const dispatch = useAppDispatch()
  const localTransactions = useSelectAddressTransactions(address)

  // Merge local and remote txs into one array and reconcile data discrepancies
  return useMemo((): TransactionDetails[] | undefined => {
    if (!remoteTransactions?.length) return localTransactions
    if (!localTransactions?.length) return remoteTransactions

    const txHashes = new Set<string>()

    const remoteTxMap: Map<string, TransactionDetails> = new Map()
    remoteTransactions.forEach((tx) => {
      if (tx.hash) {
        const txHash = tx.hash.toLowerCase()
        remoteTxMap.set(txHash, tx)
        txHashes.add(txHash)
      } else {
        logger.error(new Error('Remote transaction is missing hash '), {
          tags: { file: 'transactions/hooks', function: 'useMergeLocalAndRemoteTransactions' },
          extra: { tx },
        })
      }
    })

    const localTxMap: Map<string, TransactionDetails> = new Map()
    localTransactions.forEach((tx) => {
      if (tx.hash) {
        const txHash = tx.hash.toLowerCase()
        localTxMap.set(txHash, tx)
        txHashes.add(txHash)
      } else {
        // TODO(MOB-1737): Figure out why transactions are missing a hash and fix root issue
        logger.error(new Error('Local transaction is missing hash '), {
          tags: { file: 'transactions/hooks', function: 'useMergeLocalAndRemoteTransactions' },
          extra: { tx },
        })
      }
    })

    const deDupedTxs: TransactionDetails[] = []

    for (const txHash of [...txHashes]) {
      const remoteTx = remoteTxMap.get(txHash)
      const localTx = localTxMap.get(txHash)

      if (!localTx) {
        if (!remoteTx) throw new Error('No local or remote tx, which is not possible')
        deDupedTxs.push(remoteTx)
        continue
      }

      // If the BE hasn't detected the tx, then use local data
      if (!remoteTx) {
        deDupedTxs.push(localTx)
        continue
      }

      // If the local tx is not finalized and remote is, then finalize local state so confirmation toast is sent
      // TODO(MOB-1573): This should be done further upstream when parsing data not in a display hook
      if (!isFinalizedTx(localTx)) {
        const mergedTx = { ...localTx, status: remoteTx.status }
        if (isFinalizedTx(mergedTx)) dispatch(finalizeTransaction(mergedTx))
      }

      // If the tx isn't successful, then prefer local data
      if (remoteTx.status !== TransactionStatus.Success) {
        deDupedTxs.push(localTx)
        continue
      }

      // If the tx was done via WC, then add the dapp info from WC to the remote data
      if (localTx.typeInfo.type === TransactionType.WCConfirm) {
        const externalDappInfo = { ...localTx.typeInfo.dapp }
        const mergedTx = { ...remoteTx, typeInfo: { ...remoteTx.typeInfo, externalDappInfo } }
        deDupedTxs.push(mergedTx)
        continue
      }

      // Remote data should be better parsed in all other instances
      deDupedTxs.push(remoteTx)
    }

    return deDupedTxs.sort((a, b) => {
      // If inclusion times are equal, then sequence approve txs before swap txs
      if (a.addedTime === b.addedTime) {
        if (
          a.typeInfo.type === TransactionType.Approve &&
          b.typeInfo.type === TransactionType.Swap
        ) {
          const aCurrencyId = buildCurrencyId(a.chainId, a.typeInfo.tokenAddress)
          const bCurrencyId = b.typeInfo.inputCurrencyId
          if (areCurrencyIdsEqual(aCurrencyId, bCurrencyId)) return 1
        }

        if (
          a.typeInfo.type === TransactionType.Swap &&
          b.typeInfo.type === TransactionType.Approve
        ) {
          const aCurrencyId = a.typeInfo.inputCurrencyId
          const bCurrencyId = buildCurrencyId(b.chainId, b.typeInfo.tokenAddress)
          if (areCurrencyIdsEqual(aCurrencyId, bCurrencyId)) return -1
        }
      }

      return a.addedTime > b.addedTime ? -1 : 1
    })
  }, [dispatch, localTransactions, remoteTransactions])
}

export function useLowestPendingNonce(): BigNumberish | undefined {
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const pending = usePendingTransactions(activeAccountAddress)

  return useMemo(() => {
    let min: BigNumberish | undefined
    if (!pending) return
    pending.map((txn: TransactionDetails) => {
      const currentNonce = txn.options?.request?.nonce
      min = min ? (currentNonce ? (min < currentNonce ? min : currentNonce) : min) : currentNonce
    })
    return min
  }, [pending])
}

/**
 * Gets all transactions from a given sender and to a given recipient
 * @param sender Get all transactions sent by this sender
 * @param recipient Then filter so that we only keep txns to this recipient
 */
export function useAllTransactionsBetweenAddresses(
  sender: Address,
  recipient: string | undefined | null
): TransactionDetails[] | undefined {
  const txnsToSearch = useSelectAddressTransactions(sender)
  return useMemo(() => {
    if (!sender || !recipient || !txnsToSearch) return

    return txnsToSearch.filter(
      (tx: TransactionDetails) =>
        tx.typeInfo.type === TransactionType.Send && tx.typeInfo.recipient === recipient
    )
  }, [recipient, sender, txnsToSearch])
}
