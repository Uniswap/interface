import { useWeb3React } from '@web3-react/core'
import { useGatewayDNSUpdateAllEnabled } from 'featureFlags/flags/gatewayDNSUpdate'
import ms from 'ms'
import { useEffect } from 'react'
import { isFinalizedOrder } from 'state/signatures/hooks'
import { UniswapXOrderDetails } from 'state/signatures/types'

import { OrderQueryResponse, UniswapXBackendOrder } from './types'

const UNISWAP_API_URL = process.env.REACT_APP_UNISWAP_API_URL
const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_API_URL === undefined || UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_API_URL and UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

function fetchOrderStatuses(account: string, orders: UniswapXOrderDetails[], gatewayDNSUpdateAllEnabled: boolean) {
  const orderHashes = orders.map((order) => order.orderHash).join(',')
  const baseURL = gatewayDNSUpdateAllEnabled ? UNISWAP_GATEWAY_DNS_URL : UNISWAP_API_URL
  return global.fetch(`${baseURL}/orders?swapper=${account}&orderHashes=${orderHashes}`)
}

const OFF_CHAIN_ORDER_STATUS_POLLING = ms(`2s`)

interface UpdaterProps {
  pendingOrders: UniswapXOrderDetails[]
  onOrderUpdate: (order: UniswapXOrderDetails, backendUpdate: UniswapXBackendOrder) => void
}

export default function OrderUpdater({ pendingOrders, onOrderUpdate }: UpdaterProps): null {
  const { account } = useWeb3React()

  const gatewayDNSUpdateAllEnabled = useGatewayDNSUpdateAllEnabled()

  useEffect(() => {
    async function getOrderStatuses() {
      if (!account || pendingOrders.length === 0) return

      // Stop polling if all orders in our queue have "finalized" states
      if (pendingOrders.every((order) => isFinalizedOrder(order.status))) {
        clearInterval(interval)
        return
      }

      try {
        const pollOrderStatus = await fetchOrderStatuses(account, pendingOrders, gatewayDNSUpdateAllEnabled)

        const orderStatuses: OrderQueryResponse = await pollOrderStatus.json()
        pendingOrders.forEach((pendingOrder) => {
          const updatedOrder = orderStatuses.orders.find((order) => order.orderHash === pendingOrder.orderHash)
          if (updatedOrder) {
            onOrderUpdate(pendingOrder, updatedOrder)
          }
        })
      } catch (e) {
        console.error('Error fetching order statuses', e)
      }
    }

    const interval = setInterval(getOrderStatuses, OFF_CHAIN_ORDER_STATUS_POLLING)
    return () => clearInterval(interval)
  }, [account, gatewayDNSUpdateAllEnabled, onOrderUpdate, pendingOrders])

  return null
}
