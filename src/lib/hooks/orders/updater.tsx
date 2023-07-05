import { useWeb3React } from '@web3-react/core'
import { useEffect } from 'react'
import { isFinalizedOrder } from 'state/signatures/hooks'
import { UniswapXOrderDetails } from 'state/signatures/types'

import { OrderQueryResponse, UniswapXBackendOrder } from './types'

const UNISWAPX_API_URL = process.env.REACT_APP_UNISWAPX_API_URL
if (UNISWAPX_API_URL === undefined) {
  throw new Error(`REACT_APP_UNISWAPX_API_URL must be a defined environment variable`)
}

function fetchOrderStatuses(account: string, orders: UniswapXOrderDetails[]) {
  const orderHashes = orders.map((order) => order.orderHash).join(',')
  return global.fetch(`${UNISWAPX_API_URL}/orders?swapper=${account}&orderHashes=${orderHashes}`)
}

const OFF_CHAIN_ORDER_STATUS_POLLING = 2000 // every 2 seconds

interface UpdaterProps {
  pendingOrders: UniswapXOrderDetails[]
  onOrderUpdate: (order: UniswapXOrderDetails, backendUpdate: UniswapXBackendOrder) => void
}

export default function OrderUpdater({ pendingOrders, onOrderUpdate }: UpdaterProps): null {
  const { account } = useWeb3React()

  useEffect(() => {
    async function getOrderStatuses() {
      if (!account || pendingOrders.length === 0) return

      // Stop polling if all orders in our queue have "finalized" states
      if (pendingOrders.every((order) => isFinalizedOrder(order.status))) {
        clearInterval(interval)
        return
      }

      try {
        const pollOrderStatus = await fetchOrderStatuses(account, pendingOrders)

        const orderStatuses: OrderQueryResponse = await pollOrderStatus.json()
        pendingOrders.forEach((pendingOrder) => {
          const updatedOrder = orderStatuses.orders.find((order) => order.orderHash === pendingOrder.orderHash)
          if (updatedOrder) {
            // TODO(WEB-1646): update to include onchain settled order amounts
            onOrderUpdate(pendingOrder, updatedOrder)
          }
        })
      } catch (e) {
        console.error('Error fetching order statuses', e)
      }
    }

    const interval = setInterval(getOrderStatuses, OFF_CHAIN_ORDER_STATUS_POLLING)
    return () => clearInterval(interval)
  }, [account, onOrderUpdate, pendingOrders])

  return null
}
