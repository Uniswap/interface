import { useWeb3React } from '@web3-react/core'
import { useEffect } from 'react'
import { isFinalizedOrder } from 'state/signatures/hooks'
import { DutchOrderStatus, UniswapXOrderDetails } from 'state/signatures/types'

const UNISWAPX_API_URL = process.env.REACT_APP_UNISWAPX_API_URL
if (UNISWAPX_API_URL === undefined) {
  throw new Error(`REACT_APP_UNISWAPX_API_URL must be a defined environment variable`)
}

function fetchOrderStatuses(account: string, orders: UniswapXOrderDetails[]) {
  const orderHashes = orders.map((order) => order.orderHash).join(',')
  return global.fetch(`${UNISWAPX_API_URL}/orders?offerer=${account}&orderHashes=${orderHashes}`)
}

/* Converts string from gouda backend's order status type to the GQL-compatible frontend DutchOrderStatus enum */
function toDutchOrderStatus(orderStatus: string): DutchOrderStatus {
  switch (orderStatus) {
    case 'open':
      return DutchOrderStatus.OPEN
    case 'expired':
      return DutchOrderStatus.EXPIRED
    case 'error':
      return DutchOrderStatus.ERROR
    case 'cancelled':
      return DutchOrderStatus.CANCELLED
    case 'filled':
      return DutchOrderStatus.FILLED
    case 'insufficient-funds':
      return DutchOrderStatus.INSUFFICIENT_FUNDS
    default:
      throw new Error(`Unknown order status: ${orderStatus}`)
  }
}

const OFF_CHAIN_ORDER_STATUS_POLLING = 2000 // every 2 seconds
const NUM_ORDERS_FETCHED = 10 // only fetch last 10 Gouda order statuses
// TODO(WEB-1646): update to include onchain settled order amounts
type OrderStatusResponse = {
  orders: {
    orderHash: string
    txHash?: string
    orderStatus: string
  }[]
}

interface UpdaterProps {
  pendingOrders: UniswapXOrderDetails[]
  onOrderUpdate: (order: UniswapXOrderDetails, status: DutchOrderStatus, txHash?: string) => void
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

        const orderStatuses: OrderStatusResponse = await pollOrderStatus.json()
        pendingOrders.forEach((pendingOrder) => {
          const updatedOrder = orderStatuses.orders.find((order) => order.orderHash === pendingOrder.orderHash)
          if (updatedOrder) {
            onOrderUpdate(pendingOrder, toDutchOrderStatus(updatedOrder.orderStatus), updatedOrder.txHash)
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
