import { SharedQueryClient } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback } from 'react'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { getDisplayedPriceSource } from 'uniswap/src/features/prices/getDisplayedPriceSource'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  finalizeTransaction,
  interfaceApplyTransactionHashToBatch,
  interfaceConfirmBridgeDeposit,
  updateTransaction,
} from 'uniswap/src/features/transactions/slice'
import {
  extractPlanFieldsFromTypeInfo,
  type InterfaceTransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTx } from 'uniswap/src/features/transactions/types/utils'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from '~/constants/misc'
import { useHandleUniswapXActivityUpdate } from '~/hooks/useHandleUniswapXActivityUpdate'
import { usePollPendingBatchTransactions } from '~/state/activity/polling/batch'
import { usePollPendingBridgeTransactions } from '~/state/activity/polling/bridge'
import { usePollPendingOrders } from '~/state/activity/polling/orders'
import { useActivePlanTransactions, usePollPendingPlanTransactions } from '~/state/activity/polling/plans'
import { usePollPendingTransactions } from '~/state/activity/polling/transactions'
import { type ActivityUpdate, ActivityUpdateTransactionType, type OnActivityUpdate } from '~/state/activity/types'
import { useAppDispatch } from '~/state/hooks'
import { maybeAddEarnSwapUpsellPopup } from '~/state/popups/earnSwapUpsell'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import type { TransactionDetails } from '~/state/transactions/types'
import { logSwapFinalized } from '~/tracing/swapFlowLoggers'

export function ActivityStateUpdater() {
  const onActivityUpdate = useOnActivityUpdate()
  return (
    <>
      {/* The polling updater is present to update activity states for chains that are not supported by the subscriptions service. */}
      <PollingActivityStateUpdater onActivityUpdate={onActivityUpdate} />
    </>
  )
}

function PollingActivityStateUpdater({ onActivityUpdate }: { onActivityUpdate: OnActivityUpdate }) {
  usePollPendingTransactions(onActivityUpdate)
  usePollPendingBatchTransactions(onActivityUpdate)
  usePollPendingBridgeTransactions(onActivityUpdate)
  usePollPendingOrders(onActivityUpdate)
  useActivePlanTransactions(onActivityUpdate)
  usePollPendingPlanTransactions(onActivityUpdate)
  return null
}

function canFinalizeBaseTransactionUpdate({
  original,
  update,
}: {
  original: TransactionDetails
  update: Extract<ActivityUpdate, { type: ActivityUpdateTransactionType.BaseTransaction }>['update']
}): boolean {
  // Bridge transactions that have been confirmed on the deposit side are finalized differently
  // They complete cross-chain and don't have traditional receipts when successful
  const isBridgeWithDepositConfirmed =
    original.typeInfo.type === TransactionType.Bridge && original.typeInfo.depositConfirmed

  // Batch transactions that are confirmed also don't have traditional receipts
  const isBatchTransactionConfirmed = Boolean(original.batchInfo && update.hash)

  // For successful bridge transactions with deposit confirmed or confirmed batch transactions, we don't require a receipt
  // For all other transactions (including failed bridges), we need a receipt to finalize
  const canFinalizeWithoutReceipt =
    (isBridgeWithDepositConfirmed || isBatchTransactionConfirmed) && update.status === TransactionStatus.Success

  return Boolean(update.receipt) || canFinalizeWithoutReceipt
}

function resolveSwapPriceSource({
  inputCurrencyId,
  chainId,
  isCentralizedPricesEnabled,
}: {
  inputCurrencyId: string | undefined
  chainId: number
  isCentralizedPricesEnabled: boolean
}) {
  const address = inputCurrencyId?.includes('-') ? currencyIdToAddress(inputCurrencyId) : undefined
  if (!address) {
    return undefined
  }
  return getDisplayedPriceSource({
    isCentralizedPricesEnabled,
    surface: 'usdc',
    chainId,
    address,
    queryClient: SharedQueryClient,
  })
}

function useOnActivityUpdate(): OnActivityUpdate {
  const dispatch = useAppDispatch()
  const analyticsContext = useTrace()
  const isCentralizedPricesEnabled = useFeatureFlag(FeatureFlags.CentralizedPrices)
  const isEarnEnabled = useIsEarnEnabled()
  const handleUniswapXActivityUpdate = useHandleUniswapXActivityUpdate()

  return useCallback(
    (activity: ActivityUpdate) => {
      const popupDismissalTime = isL2ChainId(activity.chainId) ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      const { chainId } = activity

      if (activity.type === ActivityUpdateTransactionType.BaseTransaction) {
        const { original, update } = activity

        // TODO(WEB-7631): Make batch handling explicit
        if (original.batchInfo && update.hash) {
          dispatch(
            interfaceApplyTransactionHashToBatch({
              batchId: original.batchInfo.batchId,
              chainId,
              hash: update.hash,
              address: original.from,
            }),
          )
        }

        const hash = update.hash ?? original.hash

        // If a bridging deposit transaction is successful, we update `depositConfirmed`but keep activity pending until the cross-chain bridge transaction confirm in bridge.ts
        if (
          original.typeInfo.type === TransactionType.Bridge &&
          !original.typeInfo.depositConfirmed &&
          update.status === TransactionStatus.Success
        ) {
          dispatch(interfaceConfirmBridgeDeposit({ chainId, id: original.id, address: original.from, ...update }))
          return
        }

        if (!canFinalizeBaseTransactionUpdate({ original, update })) {
          // We should not finalize a transaction without a confirmed receipt (except for successful bridge and batch transactions)
          return
        }

        const receipt = update.receipt

        const updatedTransaction: InterfaceTransactionDetails = {
          ...original,
          typeInfo: update.typeInfo,
          receipt,
          networkFee: update.networkFee ?? original.networkFee,
          status: update.status,
          hash,
          sponsorInfo: update.sponsorInfo ?? original.sponsorInfo,
        }

        if (!isFinalizedTx(updatedTransaction)) {
          // Log the validation failure instead of throwing an error
          // This prevents the transaction from being missed completely
          logger.error('Transaction validation failed - missing required fields for finalization', {
            tags: { file: 'updater.tsx', function: 'useOnActivityUpdate' },
            extra: {
              transactionId: original.id,
              hash,
              status: update.status,
              hasReceipt: !!receipt,
              transaction: updatedTransaction,
            },
          })

          // Update transaction with any relevant changes
          dispatch(updateTransaction(updatedTransaction))

          // Return early to continue checking for this transaction
          return
        }

        dispatch(finalizeTransaction(updatedTransaction))

        const batchId = original.batchInfo?.batchId

        if (original.typeInfo.type === TransactionType.Swap) {
          logSwapFinalized({
            id: original.id,
            hash,
            batchId,
            chainInId: chainId,
            chainOutId: chainId,
            analyticsContext,
            status: update.status,
            type: original.typeInfo.type,
            swapStartTimestamp: original.typeInfo.swapStartTimestamp,
            planAnalytics: extractPlanFieldsFromTypeInfo(original.typeInfo),
            transactedUSDValue: original.typeInfo.transactedUSDValue,
            isSponsored: original.typeInfo.isSponsored,
            sponsorshipCampaignId: original.typeInfo.sponsorshipCampaignId,
            rwaAnalytics: {
              market_closed: original.typeInfo.marketClosed,
              price_warning: original.typeInfo.priceWarning,
              token_in_stocks: original.typeInfo.tokenInStocks,
              token_out_stocks: original.typeInfo.tokenOutStocks,
            },
            priceSource: resolveSwapPriceSource({
              inputCurrencyId: original.typeInfo.inputCurrencyId,
              chainId,
              isCentralizedPricesEnabled,
            }),
          })
        } else if (original.typeInfo.type === TransactionType.Bridge) {
          const bridgeChainIn = currencyIdToChain(original.typeInfo.inputCurrencyId) ?? chainId
          logSwapFinalized({
            id: original.id,
            hash,
            batchId,
            chainInId: bridgeChainIn,
            chainOutId: currencyIdToChain(original.typeInfo.outputCurrencyId) ?? chainId,
            analyticsContext,
            status: update.status,
            type: original.typeInfo.type,
            swapStartTimestamp: original.typeInfo.swapStartTimestamp,
            planAnalytics: extractPlanFieldsFromTypeInfo(original.typeInfo),
            transactedUSDValue: original.typeInfo.transactedUSDValue,
            isSponsored: original.typeInfo.isSponsored,
            sponsorshipCampaignId: original.typeInfo.sponsorshipCampaignId,
            rwaAnalytics: {
              market_closed: original.typeInfo.marketClosed,
              price_warning: original.typeInfo.priceWarning,
              token_in_stocks: original.typeInfo.tokenInStocks,
              token_out_stocks: original.typeInfo.tokenOutStocks,
            },
            priceSource: resolveSwapPriceSource({
              inputCurrencyId: original.typeInfo.inputCurrencyId,
              chainId: bridgeChainIn,
              isCentralizedPricesEnabled,
            }),
          })
        } else if (original.typeInfo.type === TransactionType.AuctionLaunch && original.typeInfo.analytics) {
          // Emit the terminal launch event from the Submitted-time snapshot persisted on the tx, so it
          // agrees with Submitted. Canceled/Expired are user-driven, not launch failures, so skipped.
          const launchAnalytics = original.typeInfo.analytics
          if (update.status === TransactionStatus.Success && hash) {
            sendAnalyticsEvent(AuctionEventName.AuctionCreateCompleted, {
              ...launchAnalytics,
              transaction_hash: hash,
            })
          } else if (update.status === TransactionStatus.Failed) {
            sendAnalyticsEvent(AuctionEventName.AuctionCreateFailed, {
              ...launchAnalytics,
              failed_step: 'onchain',
              transaction_hash: hash,
            })
          }
        }

        if (hash) {
          popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)
        }

        maybeAddEarnSwapUpsellPopup({
          isEarnEnabled,
          status: updatedTransaction.status,
          typeInfo: updatedTransaction.typeInfo,
          transactionId: updatedTransaction.id,
          swapPopupKey: hash,
        })
        // TransactionType can only be UniswapXOrder here
        // This check is in place in case more types get added in the future
      } else if (activity.type === ActivityUpdateTransactionType.UniswapXOrder) {
        handleUniswapXActivityUpdate({ activity, popupDismissalTime })
      } else if (
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        activity.type === ActivityUpdateTransactionType.Plan
      ) {
        const { update } = activity
        if (isFinalizedTx(update)) {
          dispatch(finalizeTransaction(update))
          popupRegistry.addPopup(
            {
              type: PopupType.Plan,
              planId: update.typeInfo.planId,
            },
            update.typeInfo.planId,
            popupDismissalTime,
          )

          maybeAddEarnSwapUpsellPopup({
            isEarnEnabled,
            status: update.status,
            typeInfo: update.typeInfo,
            transactionId: update.id,
            swapPopupKey: update.typeInfo.planId,
          })
        } else {
          dispatch(updateTransaction(update))
        }
      }
    },
    [analyticsContext, dispatch, handleUniswapXActivityUpdate, isCentralizedPricesEnabled, isEarnEnabled],
  )
}

export default ActivityStateUpdater
