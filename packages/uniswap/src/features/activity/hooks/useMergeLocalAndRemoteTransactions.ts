import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { finalizeTransaction, updateTransactionWithoutWatch } from 'uniswap/src/features/transactions/slice'
import {
  type ActivePlanState,
  activePlanStore,
} from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx, isPlanTransactionDetails } from 'uniswap/src/features/transactions/types/utils'
import { ensureLeading0x } from 'uniswap/src/utils/addresses'
import { areCurrencyIdsEqual, buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useStore } from 'zustand'

type HashToTxMap = Map<string, TransactionDetails>

/** Collects all transaction hashes that are part of plan stepDetails */
function collectPlanStepHashesFromArray(transactions: TransactionDetails[]): Set<string> {
  const planStepHashes = new Set<string>()
  for (const tx of transactions) {
    if (tx.typeInfo.type === TransactionType.Plan) {
      for (const step of tx.typeInfo.stepDetails) {
        if (step.hash) {
          planStepHashes.add(ensureLeading0x(step.hash.toLowerCase()))
        }
      }
    }
  }
  return planStepHashes
}

/** Filters out transactions whose hash is part of a plan's stepDetails */
function filterPlanStepTransactions(
  transactions: TransactionDetails[],
  planStepHashes: Set<string>,
): TransactionDetails[] {
  if (planStepHashes.size === 0) {
    return transactions
  }
  return transactions.filter((tx) => {
    if (!tx.hash) {
      return true
    }
    const hash = ensureLeading0x(tx.hash.toLowerCase())
    return !planStepHashes.has(hash)
  })
}

/** Check if a plan is currently active or backgrounded in the plan store */
function isPlanTrackedInStore(planId: string): boolean {
  const { activePlan, backgroundedPlans } = activePlanStore.getState()
  return activePlan?.planId === planId || backgroundedPlans[planId] !== undefined
}

/**
 * For plans that are currently being tracked (active or backgrounded),
 * show Pending instead of AwaitingAction to avoid showing "interrupted" UI
 * while the user is still actively working on the plan.
 */
function withDisplayStatusForTrackedPlans(tx: TransactionDetails): TransactionDetails {
  if (isPlanTransactionDetails(tx) && tx.status === TransactionStatus.AwaitingAction) {
    if (isPlanTrackedInStore(tx.typeInfo.planId)) {
      return { ...tx, status: TransactionStatus.Pending }
    }
  }
  return tx
}

/** Returns a stable key that changes when the set of tracked plans changes. */
function selectTrackedPlansKey(state: ActivePlanState): string {
  const ids: string[] = []
  if (state.activePlan) {
    ids.push(state.activePlan.planId)
  }
  for (const planId of Object.keys(state.backgroundedPlans)) {
    ids.push(planId)
  }
  return ids.join(',')
}

/**
 * Merge local and remote transactions. If duplicated hash found use data from local store.
 */
export function useMergeLocalAndRemoteTransactions({
  evmAddress,
  svmAddress,
  remoteTransactions,
}: {
  evmAddress?: Address
  svmAddress?: Address
  remoteTransactions: TransactionDetails[] | undefined
}): TransactionDetails[] | undefined {
  const dispatch = useDispatch()
  const localTransactions = useSelectAddressTransactions({ evmAddress, svmAddress })
  const trackedPlansKey = useStore(activePlanStore, selectTrackedPlansKey)

  const { chains } = useEnabledChains()

  // Merge local and remote txs into one array and reconcile data discrepancies
  // biome-ignore lint/correctness/useExhaustiveDependencies: trackedPlanKey is a signal dep that triggers re-computation when activePlanStore changes so withDisplayStatusForTrackedPlans reads fresh state.
  return useMemo((): TransactionDetails[] | undefined => {
    if (!remoteTransactions?.length) {
      return localTransactions?.map(withDisplayStatusForTrackedPlans)
    }

    // If only remote transactions exist, filter out plan step transactions and return
    if (!localTransactions?.length) {
      const planStepHashes = collectPlanStepHashesFromArray(remoteTransactions)
      return filterPlanStepTransactions(remoteTransactions, planStepHashes).map(withDisplayStatusForTrackedPlans)
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

    // Collect all transaction hashes that are part of plan stepDetails
    // These should be filtered out from the activity list since they're represented by their parent Plan transaction
    const planStepHashes = collectPlanStepHashesFromArray(remoteTransactions)
    for (const hash of collectPlanStepHashesFromArray(localTransactions)) {
      planStepHashes.add(hash)
    }

    /** Returns the hash that should be used to deduplicate transactions. */
    function getTrackingHash(tx: TransactionDetails): string | undefined {
      if (tx.hash) {
        return ensureLeading0x(tx.hash.toLowerCase())
      } else if (isUniswapX(tx) && tx.orderHash) {
        const orderHash = ensureLeading0x(tx.orderHash.toLowerCase())
        return orderHashToTxHashMap.get(orderHash) ?? orderHash
      } else if (tx.typeInfo.type === TransactionType.Plan) {
        return tx.typeInfo.planId
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
      // Skip transactions that are part of a plan's stepDetails (they're already represented by the Plan transaction)
      if (planStepHashes.has(hash)) {
        continue
      }

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

      if (isPlanTransactionDetails(localTx) && isPlanTransactionDetails(remoteTx)) {
        const remoteIsNewer = remoteTx.updatedTime > localTx.updatedTime
        if (remoteIsNewer) {
          dispatch(updateTransactionWithoutWatch(remoteTx))
          deDupedTxs.push(remoteTx)
        } else {
          deDupedTxs.push(localTx)
        }
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
        const externalDappInfo = { ...localTx.typeInfo.dappRequestInfo }
        // Preserve local addedTime (user submission time) instead of remote's block timestamp
        const mergedTx = {
          ...remoteTx,
          addedTime: localTx.addedTime,
          typeInfo: { ...remoteTx.typeInfo, externalDappInfo },
        }
        deDupedTxs.push(mergedTx)
        continue
      }

      // Remote data should be better parsed in all other instances
      // Preserve local addedTime (user submission time) instead of remote's block timestamp
      deDupedTxs.push({ ...remoteTx, addedTime: localTx.addedTime })
    }

    return deDupedTxs.map(withDisplayStatusForTrackedPlans).sort((a, b) => {
      const timeA = isPlanTransactionDetails(a) ? a.updatedTime : a.addedTime
      const timeB = isPlanTransactionDetails(b) ? b.updatedTime : b.addedTime
      // If inclusion times are equal, then sequence approve txs before swap txs
      if (timeA === timeB) {
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

        // If timestamps are equal, then keep the order of the transactions
        return 0
      }

      return timeA > timeB ? -1 : 1
    })
  }, [dispatch, localTransactions, remoteTransactions, chains, trackedPlansKey])
}
