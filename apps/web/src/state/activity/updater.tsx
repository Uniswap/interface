import { useTrace } from 'analytics'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback } from 'react'
import { useAddPopup } from 'state/application/hooks'
import { PopupType } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { updateSignature } from 'state/signatures/reducer'
import { SignatureType } from 'state/signatures/types'
import { addTransaction, finalizeTransaction } from 'state/transactions/reducer'
import { TransactionType } from 'state/transactions/types'
import { logSwapSuccess } from 'tracing/swapFlowLoggers'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { isL2ChainId } from 'utils/chains'
import { usePollPendingOrders } from './polling/orders'
import { usePollPendingTransactions } from './polling/transactions'
import { useOnAssetActivity } from './subscription'
import { ActivityUpdate, OnActivityUpdate } from './types'

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
        const { chainId, original, update, receipt } = activity
        const hash = original.hash
        dispatch(finalizeTransaction({ chainId, hash, receipt, info: update?.info }))

        if (receipt.status === 1 && original.info.type === TransactionType.SWAP) {
          logSwapSuccess(hash, chainId, analyticsContext)
        }

        addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)
      } else if (activity.type === 'signature') {
        const { chainId, original, update, receipt } = activity
        const updatedOrder = { ...original, ...update, txHash: receipt?.transactionHash }
        dispatch(updateSignature(updatedOrder))

        if (receipt && updatedOrder.status === UniswapXOrderStatus.FILLED) {
          const hash = receipt.transactionHash
          const from = original.offerer
          // Add a transaction in addition to updating signature for filled orders
          dispatch(addTransaction({ chainId, from, hash, info: updatedOrder.swapInfo, receipt }))
          addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)

          // Only track swap success for Dutch orders; limit order fill-time will throw off time tracking analytics
          if (original.type !== SignatureType.SIGN_LIMIT && receipt.status === 1) {
            logSwapSuccess(hash, chainId, analyticsContext)
          }
        } else if (original.status !== updatedOrder.status) {
          const orderHash = original.orderHash
          addPopup({ type: PopupType.Order, orderHash }, orderHash, popupDismissalTime)
        }
      }
    },
    [addPopup, analyticsContext, dispatch]
  )
}
