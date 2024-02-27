import { Currency } from '@uniswap/sdk-core'
import { BigNumberish } from 'ethers'
import { useMemo } from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  makeSelectTransaction,
  useSelectAddressTransactions,
} from 'wallet/src/features/transactions/selectors'
import { finalizeTransaction } from 'wallet/src/features/transactions/slice'
import {
  createSwapFormFromTxDetails,
  createWrapFormFromTxDetails,
} from 'wallet/src/features/transactions/swap/createSwapFormFromTxDetails'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  isFinalizedTx,
} from 'wallet/src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'
import { areCurrencyIdsEqual, buildCurrencyId } from 'wallet/src/utils/currencyId'

export function usePendingTransactions(
  address: Address | null,
  ignoreTransactionTypes: TransactionType[] = []
): TransactionDetails[] | undefined {
  const transactions = useSelectAddressTransactions(address)
  return useMemo(() => {
    if (!transactions) {
      return
    }
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
    if (!transactions) {
      return
    }
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

/**
 * Merge local and remote transactions. If duplicated hash found use data from local store.
 */
export function useMergeLocalAndRemoteTransactions(
  address: Address,
  remoteTransactions: TransactionDetails[] | undefined
): TransactionDetails[] | undefined {
  const dispatch = useAppDispatch()
  const localTransactions = useSelectAddressTransactions(address)

  // Merge local and remote txs into one array and reconcile data discrepancies
  return useMemo((): TransactionDetails[] | undefined => {
    if (!remoteTransactions?.length) {
      return localTransactions
    }
    if (!localTransactions?.length) {
      return remoteTransactions
    }

    const txHashes = new Set<string>()
    const offChainFiatOnRampTxs: TransactionDetails[] = []

    const remoteTxMap: Map<string, TransactionDetails> = new Map()
    remoteTransactions.forEach((tx) => {
      if (tx.hash) {
        const txHash = tx.hash.toLowerCase()
        remoteTxMap.set(txHash, tx)
        txHashes.add(txHash)
      } else {
        offChainFiatOnRampTxs.push(tx)
      }
    })

    const localTxMap: Map<string, TransactionDetails> = new Map()
    localTransactions.forEach((tx) => {
      if (tx.hash) {
        const txHash = tx.hash.toLowerCase()
        localTxMap.set(txHash, tx)
        txHashes.add(txHash)
      } else {
        offChainFiatOnRampTxs.push(tx)
      }
    })

    const deDupedTxs: TransactionDetails[] = [...offChainFiatOnRampTxs]

    for (const txHash of [...txHashes]) {
      const remoteTx = remoteTxMap.get(txHash)
      const localTx = localTxMap.get(txHash)
      if (!localTx) {
        if (!remoteTx) {
          throw new Error('No local or remote tx, which is not possible')
        }
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
        if (isFinalizedTx(mergedTx)) {
          dispatch(finalizeTransaction(mergedTx))
        }
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

      // If the tx is FiatPurchase and it's already on-chain, then use locally stored data, which comes from FOR provider API
      if (localTx.typeInfo.type === TransactionType.FiatPurchase) {
        deDupedTxs.push(localTx)
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
          if (areCurrencyIdsEqual(aCurrencyId, bCurrencyId)) {
            return 1
          }
        }

        if (
          a.typeInfo.type === TransactionType.Swap &&
          b.typeInfo.type === TransactionType.Approve
        ) {
          const aCurrencyId = a.typeInfo.inputCurrencyId
          const bCurrencyId = buildCurrencyId(b.chainId, b.typeInfo.tokenAddress)
          if (areCurrencyIdsEqual(aCurrencyId, bCurrencyId)) {
            return -1
          }
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
    if (!pending) {
      return
    }
    pending.map((txn: TransactionDetails) => {
      const currentNonce = txn.options?.request?.nonce
      min = min ? (currentNonce ? (min < currentNonce ? min : currentNonce) : min) : currentNonce
    })
    return min
  }, [pending])
}
