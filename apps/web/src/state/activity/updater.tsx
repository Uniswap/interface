import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback } from 'react'
import { usePollPendingOrders } from 'state/activity/polling/orders'
import { usePollPendingTransactions } from 'state/activity/polling/transactions'
import { useOnAssetActivity } from 'state/activity/subscription'
import { ActivityUpdate, OnActivityUpdate } from 'state/activity/types'
import { useAddPopup } from 'state/application/hooks'
import { PopupType } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { updateSignature } from 'state/signatures/reducer'
import { SignatureType } from 'state/signatures/types'
import { addTransaction, finalizeTransaction } from 'state/transactions/reducer'
import { TransactionType } from 'state/transactions/types'
import { logSwapSuccess, logUniswapXSwapSuccess } from 'tracing/swapFlowLoggers'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function ActivityStateUpdater() {
  const onActivityUpdate = useOnActivityUpdate()
  return (
    <>
      <SubscriptionActivityStateUpdater onActivityUpdate={onActivityUpdate} />
      {/* The polling updater is present to update activity states for chains that are not supported by the subscriptions service. */}
      <PollingActivityStateUpdater onActivityUpdate={onActivityUpdate} />
    </>
  )
}

function SubscriptionActivityStateUpdater({ onActivityUpdate }: { onActivityUpdate: OnActivityUpdate }) {
  useOnAssetActivity(onActivityUpdate)
  return null
}

function PollingActivityStateUpdater({ onActivityUpdate }: { onActivityUpdate: OnActivityUpdate }) {
  usePollPendingTransactions(onActivityUpdate)
  usePollPendingOrders(onActivityUpdate)
  return null
}

function useOnActivityUpdate(): OnActivityUpdate {
  const dispatch = useAppDispatch()
  const addPopup = useAddPopup()
  const analyticsContext = useTrace()

  return useCallback(
    (activity: ActivityUpdate) => {
      const popupDismissalTime = isL2ChainId(activity.chainId) ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      if (activity.type === 'transaction') {
        const { chainId, original, update } = activity
        const hash = original.hash
        dispatch(finalizeTransaction({ chainId, hash, ...update }))

        if (original.info.type === TransactionType.SWAP && update.status === TransactionStatus.Confirmed) {
          logSwapSuccess(hash, chainId, analyticsContext)
        }

        addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)
      } else if (activity.type === 'signature') {
        const { chainId, original, update } = activity

        // Return early if the order is already filled
        if (original.status === UniswapXOrderStatus.FILLED) {
          return
        }

        const updatedOrder = { ...original, ...update }
        dispatch(updateSignature(updatedOrder))

        if (updatedOrder.status === UniswapXOrderStatus.FILLED) {
          const hash = updatedOrder.txHash
          const from = original.offerer
          // Add a transaction in addition to updating signature for filled orders
          dispatch(addTransaction({ chainId, from, hash, info: updatedOrder.swapInfo }))
          addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)

          // Only track swap success for Dutch orders; limit order fill-time will throw off time tracking analytics
          if (original.type !== SignatureType.SIGN_LIMIT) {
            logUniswapXSwapSuccess(hash, updatedOrder.orderHash, chainId, analyticsContext)
          }
        } else if (original.status !== updatedOrder.status) {
          const orderHash = original.orderHash
          addPopup({ type: PopupType.Order, orderHash }, orderHash, popupDismissalTime)
        }
      }
    },
    [addPopup, analyticsContext, dispatch],
  )
}
