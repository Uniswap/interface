import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback } from 'react'
import { usePollPendingBridgeTransactions } from 'state/activity/polling/bridge'
import { usePollPendingOrders } from 'state/activity/polling/orders'
import { usePollPendingTransactions } from 'state/activity/polling/transactions'
import { ActivityUpdate, OnActivityUpdate } from 'state/activity/types'
import { useAppDispatch } from 'state/hooks'
import { updateSignature } from 'state/signatures/reducer'
import { SignatureType } from 'state/signatures/types'
import { addTransaction, confirmBridgeDeposit, finalizeTransaction } from 'state/transactions/reducer'
import { TransactionType } from 'state/transactions/types'
import { logSwapFinalized, logUniswapXSwapFinalized } from 'tracing/swapFlowLoggers'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

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
  usePollPendingBridgeTransactions(onActivityUpdate)
  usePollPendingOrders(onActivityUpdate)
  return null
}

function useOnActivityUpdate(): OnActivityUpdate {
  const dispatch = useAppDispatch()
  const analyticsContext = useTrace()

  return useCallback(
    (activity: ActivityUpdate) => {
      const popupDismissalTime = isL2ChainId(activity.chainId) ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      if (activity.type === 'transaction') {
        const { chainId, original, update } = activity
        const hash = original.hash

        // If a bridging deposit transaction is successful, we update `depositConfirmed`but keep activity pending until the cross-chain bridge transaction confirm in bridge.ts
        if (
          original.info.type === TransactionType.BRIDGE &&
          !original.info.depositConfirmed &&
          update.status === TransactionStatus.Confirmed
        ) {
          dispatch(confirmBridgeDeposit({ chainId, hash, ...update }))
          return
        }

        dispatch(finalizeTransaction({ chainId, hash, ...update }))

        if (original.info.type === TransactionType.SWAP) {
          logSwapFinalized(hash, chainId, chainId, analyticsContext, update.status, original.info.type)
        } else if (original.info.type === TransactionType.BRIDGE) {
          logSwapFinalized(
            hash,
            original.info.inputChainId,
            original.info.outputChainId,
            analyticsContext,
            update.status,
            original.info.type,
          )
        }

        popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)
      } else if (activity.type === 'signature') {
        const { chainId, original, update } = activity

        // Return early if the order is already filled
        if (original.status === UniswapXOrderStatus.FILLED) {
          return
        }

        const updatedOrder = { ...original, ...update }
        dispatch(updateSignature(updatedOrder))

        // SignatureDetails.type should not be typed as optional, but this will be fixed when we merge activity for uniswap. The default value appeases the typechecker.
        const signatureType = updatedOrder.type ?? SignatureType.SIGN_UNISWAPX_V2_ORDER

        if (updatedOrder.status === UniswapXOrderStatus.FILLED) {
          const hash = updatedOrder.txHash
          const from = original.offerer
          // Add a transaction in addition to updating signature for filled orders
          dispatch(addTransaction({ chainId, from, hash, info: updatedOrder.swapInfo }))
          popupRegistry.addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)

          // Only track swap success for non-limit orders; limit order fill-time will throw off time tracking analytics
          if (original.type !== SignatureType.SIGN_LIMIT) {
            logUniswapXSwapFinalized(
              hash,
              updatedOrder.orderHash,
              chainId,
              analyticsContext,
              signatureType,
              UniswapXOrderStatus.FILLED,
            )
          }
        } else if (original.status !== updatedOrder.status) {
          const orderHash = original.orderHash
          popupRegistry.addPopup({ type: PopupType.Order, orderHash }, orderHash, popupDismissalTime)

          if (
            updatedOrder.status === UniswapXOrderStatus.CANCELLED ||
            updatedOrder.status === UniswapXOrderStatus.EXPIRED
          ) {
            logUniswapXSwapFinalized(
              undefined,
              updatedOrder.orderHash,
              chainId,
              analyticsContext,
              signatureType,
              updatedOrder.status,
            )
          }
        }
      }
    },
    [analyticsContext, dispatch],
  )
}
