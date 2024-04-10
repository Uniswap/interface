import { useWeb3React } from '@web3-react/core'
import { useGatewayDNSUpdateAllEnabled } from 'featureFlags/flags/gatewayDNSUpdate'
import ms from 'ms'
import { useEffect, useState } from 'react'
import { isFinalizedOrder } from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'

import { OrderQueryResponse, UniswapXBackendOrder } from './types'

const UNISWAP_API_URL = process.env.REACT_APP_UNISWAP_API_URL
const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_API_URL === undefined || UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_API_URL and UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

async function fetchStatuses(
  orders: UniswapXOrderDetails[],
  filter: (order: UniswapXOrderDetails) => boolean,
  path: (hashes: string[]) => string,
  gatewayDNSUpdateAllEnabled: boolean
): Promise<OrderQueryResponse> {
  const hashes = orders.filter(filter).map((order) => order.orderHash)
  if (!hashes || hashes.length === 0) {
    return { orders: [] }
  }
  const baseURL = gatewayDNSUpdateAllEnabled ? UNISWAP_GATEWAY_DNS_URL : UNISWAP_API_URL
  const result = await global.fetch(`${baseURL}${path(hashes)}`)
  return result.json()
}

async function fetchLimitStatuses(
  account: string,
  orders: UniswapXOrderDetails[],
  gatewayDNSUpdateAllEnabled: boolean
) {
  return fetchStatuses(
    orders,
    (order) => order.type === SignatureType.SIGN_LIMIT,
    (hashes) => `/limit-orders?swapper=${account}&orderHashes=${hashes}`,
    gatewayDNSUpdateAllEnabled
  )
}

async function fetchOrderStatuses(
  account: string,
  orders: UniswapXOrderDetails[],
  gatewayDNSUpdateAllEnabled: boolean
): Promise<OrderQueryResponse> {
  return fetchStatuses(
    orders,
    (order) => order.type === SignatureType.SIGN_UNISWAPX_ORDER,
    (hashes) => `/orders?swapper=${account}&orderHashes=${hashes}`,
    gatewayDNSUpdateAllEnabled
  )
}

const OFF_CHAIN_ORDER_STATUS_POLLING_INITIAL_INTERVAL = ms(`2s`)

interface UpdaterProps {
  pendingOrders: UniswapXOrderDetails[]
  onOrderUpdate: (order: UniswapXOrderDetails, backendUpdate: UniswapXBackendOrder) => void
}

export default function OrderUpdater({ pendingOrders, onOrderUpdate }: UpdaterProps): null {
  const { account } = useWeb3React()

  const gatewayDNSUpdateAllEnabled = useGatewayDNSUpdateAllEnabled()

  const [currentDelay, setCurrentDelay] = useState(OFF_CHAIN_ORDER_STATUS_POLLING_INITIAL_INTERVAL)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    async function getOrderStatuses() {
      if (!account || pendingOrders.length === 0) return

      // Stop polling if all orders in our queue have "finalized" states
      if (pendingOrders.every((order) => isFinalizedOrder(order.status))) {
        clearTimeout(timeout)
        return
      }
      try {
        const [orderStatuses, limitStatuses] = await Promise.all([
          fetchOrderStatuses(account, pendingOrders, gatewayDNSUpdateAllEnabled),
          fetchLimitStatuses(account, pendingOrders, gatewayDNSUpdateAllEnabled),
        ])

        pendingOrders.forEach((pendingOrder) => {
          if (pendingOrder.type === SignatureType.SIGN_LIMIT) {
            const updatedLimitOrder = limitStatuses.orders.find((order) => order.orderHash === pendingOrder.orderHash)
            if (updatedLimitOrder) {
              onOrderUpdate(pendingOrder, updatedLimitOrder)
            }
          } else {
            const updatedOrder = orderStatuses.orders.find((order) => order.orderHash === pendingOrder.orderHash)
            if (updatedOrder) {
              onOrderUpdate(pendingOrder, updatedOrder)
            }
          }
        })
      } catch (e) {
        console.error('Error fetching order statuses', e)
      }
      setCurrentDelay((currentDelay) => Math.min(currentDelay * 2, ms('30s')))
      timeout = setTimeout(getOrderStatuses, currentDelay)
    }

    timeout = setTimeout(getOrderStatuses, currentDelay)
    return () => clearTimeout(timeout)
  }, [account, currentDelay, gatewayDNSUpdateAllEnabled, onOrderUpdate, pendingOrders])

  return null
}
