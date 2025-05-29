import { Currency } from '@uniswap/sdk-core'
import { BigNumberish } from 'ethers'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { makeSelectTransaction, useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  QueuedOrderStatus,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
  isFinalizedTx,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { ensureLeading0x } from 'uniswap/src/utils/addresses'
import { areCurrencyIdsEqual, buildCurrencyId } from 'uniswap/src/utils/currencyId'
import {
  createSwapFormFromTxDetails,
  createWrapFormFromTxDetails,
} from 'wallet/src/features/transactions/swap/createSwapFormFromTxDetails'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { WalletState } from 'wallet/src/state/walletReducer'

type HashToTxMap = Map<string, TransactionDetails>

export function usePendingTransactions(
  address: Address | null,
  ignoreTransactionTypes: TransactionType[] = [],
): TransactionDetails[] | undefined {
  const transactions = useSelectAddressTransactions(address)
  return useMemo(() => {
    if (!transactions) {
      return undefined
    }
    return transactions.filter(
      (tx: { status: TransactionStatus; typeInfo: { type: TransactionType } }) =>
        tx.status === TransactionStatus.Pending && !ignoreTransactionTypes.includes(tx.typeInfo.type),
    )
  }, [ignoreTransactionTypes, transactions])
}

const ERRORED_QUEUE_STATUSES = [
  QueuedOrderStatus.AppClosed,
  QueuedOrderStatus.ApprovalFailed,
  QueuedOrderStatus.WrapFailed,
  QueuedOrderStatus.SubmissionFailed,
  QueuedOrderStatus.Stale,
] as const
export type ErroredQueuedOrderStatus = (typeof ERRORED_QUEUE_STATUSES)[number]
export type ErroredQueuedOrder = UniswapXOrderDetails & {
  status: TransactionStatus.Pending
  queueStatus: ErroredQueuedOrderStatus
}

function isErroredQueuedOrder(tx: TransactionDetails): tx is ErroredQueuedOrder {
  return Boolean(
    isUniswapX(tx) &&
      tx.status === TransactionStatus.Pending &&
      tx.queueStatus &&
      ERRORED_QUEUE_STATUSES.some((status) => status === tx.queueStatus),
  )
}

export function useErroredQueuedOrders(address: Address | null): ErroredQueuedOrder[] | undefined {
  const transactions = useSelectAddressTransactions(address)
  return useMemo(() => {
    if (!transactions) {
      return undefined
    }
    const erroredQueuedOrders: ErroredQueuedOrder[] = []
    for (const tx of transactions) {
      if (isErroredQueuedOrder(tx)) {
        erroredQueuedOrders.push(tx)
      }
    }
    return erroredQueuedOrders.sort((a, b) => b.addedTime - a.addedTime)
  }, [transactions])
}

// sorted oldest to newest
export function useSortedPendingTransactions(address: Address | null): TransactionDetails[] | undefined {
  const transactions = usePendingTransactions(address)
  return useMemo(() => {
    if (!transactions) {
      return undefined
    }
    return transactions.sort((a: TransactionDetails, b: TransactionDetails) => a.addedTime - b.addedTime)
  }, [transactions])
}

export function useSelectTransaction(
  address: Address | undefined,
  chainId: UniverseChainId | undefined,
  txId: string | undefined,
): TransactionDetails | undefined {
  const selectTransaction = useMemo(makeSelectTransaction, [])
  return useSelector((state: WalletState) => selectTransaction(state, { address, chainId, txId }))
}

export function useCreateSwapFormState(
  address: Address | undefined,
  chainId: UniverseChainId | undefined,
  txId: string | undefined,
): TransactionState | undefined {
  const transaction = useSelectTransaction(address, chainId, txId)

  const inputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap || transaction?.typeInfo.type === TransactionType.Bridge
      ? transaction.typeInfo.inputCurrencyId
      : undefined

  const outputCurrencyId =
    transaction?.typeInfo.type === TransactionType.Swap || transaction?.typeInfo.type === TransactionType.Bridge
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
  chainId: UniverseChainId | undefined,
  txId: string | undefined,
  inputCurrency: Maybe<Currency>,
  outputCurrency: Maybe<Currency>,
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
  remoteTransactions: TransactionDetails[] | undefined,
): TransactionDetails[] | undefined {
  const dispatch = useDispatch()
  const localTransactions = useSelectAddressTransactions(address)

  const { chains } = useEnabledChains()

  // Merge local and remote txs into one array and reconcile data discrepancies
  return useMemo((): TransactionDetails[] | undefined => {
    if (!remoteTransactions?.length) {
      return localTransactions
    }
    if (!localTransactions?.length) {
      return remoteTransactions
    }

    // This map enables `getTrackingHash` to deduplicate UniswapX orders in the event that one source
    // has a filled order (orderHash + txHash), while the other has it pending (orderHash only).
    const orderHashToTxHashMap = new Map<string, string>()
    function populateOrderHashToTxHashMap(tx: TransactionDetails): void {
      if (isUniswapX(tx) && tx.hash && tx.orderHash) {
        const txHash = ensureLeading0x(tx.hash.toLowerCase())
        const orderHash = ensureLeading0x(tx.orderHash.toLowerCase())
        orderHashToTxHashMap.set(orderHash, txHash)
      }
    }
    remoteTransactions.forEach(populateOrderHashToTxHashMap)
    localTransactions.forEach(populateOrderHashToTxHashMap)

    /** Returns the hash that should be used to deduplicate transactions. */
    function getTrackingHash(tx: TransactionDetails): string | undefined {
      if (tx.hash) {
        return ensureLeading0x(tx.hash.toLowerCase())
      } else if (isUniswapX(tx) && tx.orderHash) {
        const orderHash = ensureLeading0x(tx.orderHash.toLowerCase())
        return orderHashToTxHashMap.get(orderHash) ?? orderHash
      }
      return undefined
    }

    const hashes = new Set<string>()
    const offChainFORTxs = new Map<string, TransactionDetails>()
    const unsubmittedTxs: TransactionDetails[] = []

    function addToMap(map: HashToTxMap, tx: TransactionDetails): HashToTxMap {
      // If the FOR tx was done on a disabled chain, then omit it
      if (!chains.includes(tx.chainId)) {
        return map
      }

      const hash = getTrackingHash(tx)
      if (hash) {
        map.set(hash, tx)
        hashes.add(hash)
      } else if (
        tx.typeInfo.type === TransactionType.OffRampSale ||
        tx.typeInfo.type === TransactionType.OnRampPurchase ||
        tx.typeInfo.type === TransactionType.OnRampTransfer
      ) {
        offChainFORTxs.set(tx.id, tx)
      } else if (isBridge(tx) || isClassic(tx)) {
        unsubmittedTxs.push(tx)
      }
      return map
    }
    // First iterate over remote transactions, then local transactions
    // This ensures that local transactions overwrite remote transactions
    const remoteTxMap = remoteTransactions.reduce(addToMap, new Map<string, TransactionDetails>())
    const localTxMap = localTransactions.reduce(addToMap, new Map<string, TransactionDetails>())

    const deDupedTxs: TransactionDetails[] = [...offChainFORTxs.values(), ...unsubmittedTxs]

    for (const hash of [...hashes]) {
      const remoteTx = remoteTxMap.get(hash)
      const localTx = localTxMap.get(hash)
      if (!localTx) {
        if (!remoteTx) {
          throw new Error('No local or remote tx, which is not possible')
        }
        deDupedTxs.push(remoteTx)
        continue
      }

      // If the tx was done on a disabled chain, then omit it
      if (!chains.includes(localTx.chainId)) {
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
        const mergedTx = { ...localTx, status: remoteTx.status, networkFee: remoteTx.networkFee }
        if (isFinalizedTx(mergedTx)) {
          dispatch(finalizeTransaction(mergedTx))
        }
      }

      // If the tx isn't successful, then prefer local data
      const isSuccessful = remoteTx.status === TransactionStatus.Success
      // If the local tx is canceled and the remote tx is successful, the transaction is a cancellation,
      // and we have better data about the user's intent locally
      const isCancellation =
        localTx.status === TransactionStatus.Canceled && remoteTx.status === TransactionStatus.Success

      if (!isSuccessful || isCancellation) {
        const mergedTx = {
          ...localTx,
          networkFee: remoteTx.networkFee,
        }
        deDupedTxs.push(mergedTx)
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
        if (a.typeInfo.type === TransactionType.Approve && b.typeInfo.type === TransactionType.Swap) {
          const aCurrencyId = buildCurrencyId(a.chainId, a.typeInfo.tokenAddress)
          const bCurrencyId = b.typeInfo.inputCurrencyId
          if (areCurrencyIdsEqual(aCurrencyId, bCurrencyId)) {
            return 1
          }
        }

        if (a.typeInfo.type === TransactionType.Swap && b.typeInfo.type === TransactionType.Approve) {
          const aCurrencyId = a.typeInfo.inputCurrencyId
          const bCurrencyId = buildCurrencyId(b.chainId, b.typeInfo.tokenAddress)
          if (areCurrencyIdsEqual(aCurrencyId, bCurrencyId)) {
            return -1
          }
        }
      }

      return a.addedTime > b.addedTime ? -1 : 1
    })
  }, [dispatch, localTransactions, remoteTransactions, chains])
}

function useLowestPendingNonce(): BigNumberish | undefined {
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const pending = usePendingTransactions(activeAccountAddress)

  return useMemo(() => {
    let min: BigNumberish | undefined
    if (!pending) {
      return undefined
    }
    pending.map((txn: TransactionDetails) => {
      if (isClassic(txn)) {
        const currentNonce = txn.options?.request?.nonce
        min = min ? (currentNonce ? (min < currentNonce ? min : currentNonce) : min) : currentNonce
      }
    })
    return min
  }, [pending])
}

export function useIsQueuedTransaction(tx: TransactionDetails): boolean {
  const lowestPendingNonce = useLowestPendingNonce()

  if (isUniswapX(tx)) {
    return false
  }

  const nonce = tx?.options?.request?.nonce
  return nonce && lowestPendingNonce ? nonce > lowestPendingNonce : false
}
