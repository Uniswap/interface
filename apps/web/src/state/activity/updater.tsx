import { useTrace } from 'analytics'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback } from 'react'
import { useAddPopup } from 'state/application/hooks'
import { PopupType } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { updateSignature } from 'state/signatures/reducer'
import { SignatureDetails, SignatureType } from 'state/signatures/types'
import { logSwapSuccess } from 'tracing/swapFlowLoggers'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { isL2ChainId } from 'utils/chains'
import { addTransaction, finalizeTransaction } from '../transactions/reducer'
import {
  SerializableTransactionReceipt,
  TransactionDetails,
  TransactionInfo,
  TransactionType,
} from '../transactions/types'
import { usePollPendingOrders } from './orders'
import { usePollPendingTransactions } from './transactions'

type TransactionUpdate<T extends TransactionInfo> = {
  type: 'transaction'
  originalTransaction: TransactionDetails & { info: T }
  receipt: SerializableTransactionReceipt
  chainId: number
  updatedTransactionInfo?: T
}

type OrderUpdate = {
  type: 'signature'
  updatedStatus: UniswapXOrderStatus
  originalSignature: SignatureDetails
  receipt?: SerializableTransactionReceipt
  chainId: number
  updatedSwapInfo?: SignatureDetails['swapInfo']
}

type ActivityUpdate<T extends TransactionInfo> = TransactionUpdate<T> | OrderUpdate
export type ActivityUpdaterFn = <T extends TransactionInfo>(update: ActivityUpdate<T>) => void

function useUpdateActivityState() {
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

        const updatedOrder = { ...originalSignature, status: updatedStatus, swapInfo: info }
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

export function ActivityStateUpdater() {
  return (
    <>
      <SubscriptionBasedUpdater />
      {/* The polling updater is present to update activity states for chains that are not supported by the subscriptions service. */}
      <PollingBasedUpdater />
    </>
  )
}

function SubscriptionBasedUpdater() {
  // TODO(subs): Implement subscription-based activity state updates
  // const updateActivityState = useUpdateActivityState()
  // useOnReceiveActivityFromSubscription(updateActivityState)

  return null
}

function PollingBasedUpdater() {
  const updateActivityState = useUpdateActivityState()
  usePollPendingTransactions(updateActivityState)
  usePollPendingOrders(updateActivityState)

  return null
}
