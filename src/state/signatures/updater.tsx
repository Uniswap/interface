import { useWeb3React } from '@web3-react/core'
import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import OrderUpdater from 'lib/hooks/orders/updater'
import { useCallback, useMemo } from 'react'
import { PopupType } from 'state/application/reducer'
import { useAppSelector } from 'state/hooks'

import { L2_CHAIN_IDS } from '../../constants/chains'
import { useAddPopup } from '../application/hooks'
import { useUpdateOrder } from './hooks'
import { DutchLimitOrderStatus, SignatureType, UniswapXOrderDetails } from './types'

export default function Updater() {
  const { account, chainId } = useWeb3React()
  const addPopup = useAddPopup()
  const signatures = useAppSelector((state) => state.signatures)

  const pendingOrders = useMemo(() => {
    if (!account || !signatures[account]) return []
    return Object.values(signatures[account]).filter(
      (signature) =>
        signature.type === SignatureType.SIGN_UNISWAPX_ORDER && signature.status === DutchLimitOrderStatus.OPEN
    ) as UniswapXOrderDetails[]
  }, [account, signatures])

  const updateOrder = useUpdateOrder()

  const onOrderUpdate = useCallback(
    (order: UniswapXOrderDetails, updatedStatus: DutchLimitOrderStatus, txHash?: string) => {
      if (order.status === updatedStatus) return

      updateOrder(order, updatedStatus, txHash)

      // speed up popup dismisall time if on L2
      const isL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId))
      addPopup(
        txHash ? { type: PopupType.Transaction, hash: txHash } : { type: PopupType.Order, orderHash: order.orderHash },
        txHash ?? order.orderHash,
        isL2 ? L2_TXN_DISMISS_MS : DEFAULT_TXN_DISMISS_MS
      )
    },
    [addPopup, chainId, updateOrder]
  )

  return <OrderUpdater pendingOrders={pendingOrders} onOrderUpdate={onOrderUpdate} />
}
