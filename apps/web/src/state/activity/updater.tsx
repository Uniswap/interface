import { useTrace } from 'analytics'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback } from 'react'
import { useAddPopup } from 'state/application/hooks'
import { PopupType } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { updateSignature } from 'state/signatures/reducer'
import { SignatureType } from 'state/signatures/types'
import { logSwapSuccess } from 'tracing/swapFlowLoggers'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { isL2ChainId } from 'utils/chains'
import { addTransaction, finalizeTransaction } from '../transactions/reducer'
import { TransactionInfo, TransactionType } from '../transactions/types'
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

function useOnActivityUpdate() {
  const dispatch = useAppDispatch()
  const addPopup = useAddPopup()
  const analyticsContext = useTrace()

  return useCallback<<T extends TransactionInfo>(update: ActivityUpdate<T>) => void>(
    (update) => {
      const popupDismissalTime = isL2ChainId(update.chainId) ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      if (update.type === 'transaction') {
        const { originalTransaction, receipt, chainId, updatedTransactionInfo: info } = update
        const hash = originalTransaction.hash

        dispatch(finalizeTransaction({ chainId, hash, receipt, info }))

        if (receipt.status === 1 && originalTransaction.info.type === TransactionType.SWAP) {
          logSwapSuccess(hash, chainId, analyticsContext)
        }

        addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)
      } else if (update.type === 'signature') {
        const { originalSignature, updatedStatus, receipt, chainId, updatedSwapInfo } = update
        const info = updatedSwapInfo ?? originalSignature.swapInfo

        const updatedOrder = {
          ...originalSignature,
          status: updatedStatus,
          swapInfo: info,
          txHash: receipt?.transactionHash,
        }
        dispatch(updateSignature(updatedOrder))

        if (receipt && updatedStatus === UniswapXOrderStatus.FILLED) {
          const hash = receipt.transactionHash
          const from = originalSignature.offerer
          // Add a transaction in addition to updating signature for filled orders
          dispatch(addTransaction({ chainId, from, hash, info, receipt }))
          addPopup({ type: PopupType.Transaction, hash }, hash, popupDismissalTime)

          // Only track swap success for Dutch orders; limit order fill-time will throw off time tracking analytics
          if (originalSignature.type !== SignatureType.SIGN_LIMIT && receipt.status === 1) {
            logSwapSuccess(hash, chainId, analyticsContext)
          }
        } else if (originalSignature.status !== updatedStatus) {
          const orderHash = originalSignature.orderHash
          addPopup({ type: PopupType.Order, orderHash }, orderHash, popupDismissalTime)
        }
      }
    },
    [addPopup, analyticsContext, dispatch]
  )
}
