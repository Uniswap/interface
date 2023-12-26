import { TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import { UniswapXBackendOrder, UniswapXOrderStatus } from 'lib/hooks/orders/types'
import OrderUpdater from 'lib/hooks/orders/updater'
import { useCallback, useMemo } from 'react'
import { PopupType } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { addTransaction } from 'state/transactions/reducer'
import { toSerializableReceipt } from 'state/transactions/updater'
import { isL2ChainId } from 'utils/chains'

import { useAddPopup } from '../application/hooks'
import { useAllSignatures } from './hooks'
import { updateSignature } from './reducer'
import { SignatureType, UniswapXOrderDetails } from './types'

export default function Updater() {
  const { provider } = useWeb3React()
  const addPopup = useAddPopup()
  const signatures = useAllSignatures()

  const pendingOrders = useMemo(
    () =>
      Object.values(signatures).filter(
        (signature) =>
          signature.type === SignatureType.SIGN_UNISWAPX_ORDER && signature.status === UniswapXOrderStatus.OPEN
      ) as UniswapXOrderDetails[],
    [signatures]
  )

  const dispatch = useAppDispatch()

  const onOrderUpdate = useCallback(
    (order: UniswapXOrderDetails, update: UniswapXBackendOrder) => {
      if (order.status === update.orderStatus) return
      const popupDismissalTime = isL2ChainId(order.chainId) ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      const updatedOrder = { ...order, status: update.orderStatus }

      if (update.orderStatus === UniswapXOrderStatus.FILLED && update.txHash) {
        updatedOrder.txHash = update.txHash
        // Updates the order to contain the settled/on-chain output amount
        if (updatedOrder.swapInfo.tradeType === TradeType.EXACT_INPUT) {
          updatedOrder.swapInfo = {
            ...updatedOrder.swapInfo,
            settledOutputCurrencyAmountRaw: update.settledAmounts?.[0]?.amountOut,
          }
        }
        // Wait to update a filled order until the on-chain tx is available.
        provider?.getTransactionReceipt(update.txHash).then((receipt) => {
          dispatch(
            addTransaction({
              chainId: updatedOrder.chainId,
              from: updatedOrder.offerer, // TODO(WEB-2053): use filler as from once tx reducer is organized by account
              hash: update.txHash,
              info: updatedOrder.swapInfo,
              receipt: toSerializableReceipt(receipt),
            })
          )
          dispatch(updateSignature(updatedOrder))
          addPopup({ type: PopupType.Transaction, hash: update.txHash }, update.txHash, popupDismissalTime)
        })
      } else {
        dispatch(updateSignature(updatedOrder))
        addPopup({ type: PopupType.Order, orderHash: order.orderHash }, updatedOrder.orderHash, popupDismissalTime)
      }
    },
    [addPopup, dispatch, provider]
  )

  return <OrderUpdater pendingOrders={pendingOrders} onOrderUpdate={onOrderUpdate} />
}
