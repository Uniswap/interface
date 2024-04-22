import { TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import ms from 'ms'
import { useEffect, useState } from 'react'
import { isFinalizedOrder, usePendingOrders } from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { ExactInputSwapTransactionInfo } from 'state/transactions/types'
import { OrderQueryResponse, UniswapXBackendOrder, UniswapXOrderStatus } from 'types/uniswapx'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { OnActivityUpdate } from '../types'
import { toSerializableReceipt } from '../utils'

const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

async function fetchStatuses(
  orders: UniswapXOrderDetails[],
  filter: (order: UniswapXOrderDetails) => boolean,
  path: (hashes: string[]) => string
): Promise<UniswapXBackendOrder[]> {
  const hashes = orders.filter(filter).map((order) => order.orderHash)
  if (!hashes || hashes.length === 0) {
    return []
  }
  const baseURL = UNISWAP_GATEWAY_DNS_URL
  const result = await global.fetch(`${baseURL}${path(hashes)}`)
  const statuses = (await result.json()) as OrderQueryResponse
  return statuses.orders
}

async function fetchLimitStatuses(account: string, orders: UniswapXOrderDetails[]): Promise<UniswapXBackendOrder[]> {
  return fetchStatuses(
    orders,
    (order) => order.type === SignatureType.SIGN_LIMIT,
    (hashes) => `/limit-orders?swapper=${account}&orderHashes=${hashes}`
  )
}

async function fetchOrderStatuses(account: string, orders: UniswapXOrderDetails[]): Promise<UniswapXBackendOrder[]> {
  return fetchStatuses(
    orders,
    (order) => order.type === SignatureType.SIGN_UNISWAPX_ORDER || order.type === SignatureType.SIGN_UNISWAPX_V2_ORDER,
    (hashes) => `/orders?swapper=${account}&orderHashes=${hashes}`
  )
}

const OFF_CHAIN_ORDER_STATUS_POLLING_INITIAL_INTERVAL = ms(`2s`)

export function usePollPendingOrders(onActivityUpdate: OnActivityUpdate) {
  const realtimeEnabled = useFeatureFlag(FeatureFlags.Realtime)

  const { account, provider } = useWeb3React()
  const pendingOrders = usePendingOrders()

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
        const statuses = (
          await Promise.all([fetchOrderStatuses(account, pendingOrders), fetchLimitStatuses(account, pendingOrders)])
        ).flat()

        pendingOrders.forEach(async (pendingOrder) => {
          const updatedOrder = statuses.find((order) => order.orderHash === pendingOrder.orderHash)
          if (!updatedOrder) return

          const swapInfo = { ...pendingOrder.swapInfo }
          let receipt = undefined
          if (updatedOrder?.orderStatus === UniswapXOrderStatus.FILLED) {
            // Update the order to contain the settled/on-chain output amount
            if (pendingOrder.swapInfo.tradeType === TradeType.EXACT_INPUT) {
              const exactInputSwapInfo = swapInfo as ExactInputSwapTransactionInfo
              exactInputSwapInfo.settledOutputCurrencyAmountRaw = updatedOrder.settledAmounts?.[0]?.amountOut
            } else if (pendingOrder.swapInfo.tradeType === TradeType.EXACT_OUTPUT) {
              // TODO(WEB-3962): Handle settled EXACT_OUTPUT amounts
            }

            if (provider) {
              receipt = toSerializableReceipt(await provider?.getTransactionReceipt(updatedOrder.txHash))
            }
          }

          onActivityUpdate({
            type: 'signature',
            chainId: pendingOrder.chainId,
            original: pendingOrder,
            update: {
              status: updatedOrder.orderStatus,
              swapInfo,
            },
            receipt,
          })
        })
      } catch (e) {
        console.error('Error fetching order statuses', e)
      }
      setCurrentDelay((currentDelay) => Math.min(currentDelay * 2, ms('30s')))
      timeout = setTimeout(getOrderStatuses, currentDelay)
    }

    if (!realtimeEnabled) {
      timeout = setTimeout(getOrderStatuses, currentDelay)
      return () => clearTimeout(timeout)
    }
    return
  }, [account, currentDelay, onActivityUpdate, pendingOrders, provider, realtimeEnabled])

  return null
}
