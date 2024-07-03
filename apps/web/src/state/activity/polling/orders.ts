import { TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useAccount } from 'hooks/useAccount'
import ms from 'ms'
import { useEffect, useState } from 'react'
import { OnActivityUpdate, OrderUpdate } from 'state/activity/types'
import { OffchainOrderType } from 'state/routing/types'
import { isFinalizedOrder, usePendingOrders } from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { ExactInputSwapTransactionInfo } from 'state/transactions/types'
import { OrderQueryResponse, UniswapXBackendOrder, UniswapXOrderStatus } from 'types/uniswapx'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { logger } from 'utilities/src/logger/logger'

const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

async function fetchStatuses(
  orders: UniswapXOrderDetails[],
  filter: (order: UniswapXOrderDetails) => boolean,
  path: (hashes: string[]) => string,
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
    (hashes) => `/limit-orders?swapper=${account}&orderHashes=${hashes}`,
  )
}

async function fetchOrderStatuses(account: string, orders: UniswapXOrderDetails[]): Promise<UniswapXBackendOrder[]> {
  return fetchStatuses(
    orders,
    (order) => order.type === SignatureType.SIGN_UNISWAPX_ORDER || order.type === SignatureType.SIGN_UNISWAPX_V2_ORDER,
    (hashes) => `/orders?swapper=${account}&orderHashes=${hashes}&orderType=${OffchainOrderType.DUTCH_V1_AND_V2}`,
  )
}

const OFF_CHAIN_ORDER_STATUS_POLLING_INITIAL_INTERVAL = ms(`2s`)

export function usePollPendingOrders(onActivityUpdate: OnActivityUpdate) {
  const realtimeEnabled = useFeatureFlag(FeatureFlags.Realtime)

  const { provider } = useWeb3React()
  const account = useAccount()
  const pendingOrders = usePendingOrders()

  const [currentDelay, setCurrentDelay] = useState(OFF_CHAIN_ORDER_STATUS_POLLING_INITIAL_INTERVAL)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    async function getOrderStatuses() {
      if (!account.address || pendingOrders.length === 0) {
        return
      }

      // Stop polling if all orders in our queue have "finalized" states
      if (pendingOrders.every((order) => isFinalizedOrder(order))) {
        clearTimeout(timeout)
        return
      }
      try {
        const statuses = (
          await Promise.all([
            fetchOrderStatuses(account.address, pendingOrders),
            fetchLimitStatuses(account.address, pendingOrders),
          ])
        ).flat()

        pendingOrders.forEach(async (pendingOrder) => {
          const updatedOrder = statuses.find((order) => order.orderHash === pendingOrder.orderHash)
          if (!updatedOrder) {
            return
          }

          const update: OrderUpdate['update'] = {
            ...(updatedOrder.orderStatus === UniswapXOrderStatus.FILLED
              ? {
                  status: updatedOrder.orderStatus,
                  txHash: updatedOrder.txHash,
                }
              : {
                  status: updatedOrder.orderStatus,
                  txHash: undefined,
                }),
            swapInfo: { ...pendingOrder.swapInfo },
          }
          if (updatedOrder.orderStatus === UniswapXOrderStatus.FILLED) {
            // Update the order to contain the settled/on-chain output amount
            if (pendingOrder.swapInfo.tradeType === TradeType.EXACT_INPUT) {
              const exactInputSwapInfo = update.swapInfo as ExactInputSwapTransactionInfo
              exactInputSwapInfo.settledOutputCurrencyAmountRaw = updatedOrder.settledAmounts?.[0]?.amountOut
            } else if (pendingOrder.swapInfo.tradeType === TradeType.EXACT_OUTPUT) {
              // TODO(WEB-3962): Handle settled EXACT_OUTPUT amounts
            }
          }

          onActivityUpdate({
            type: 'signature',
            chainId: pendingOrder.chainId,
            original: pendingOrder,
            update,
          })
        })
      } catch (e) {
        logger.debug('usePollPendingOrders', 'getOrderStatuses', 'Failed to fetch order statuses', e)
      }
      setCurrentDelay((currentDelay) => Math.min(currentDelay * 2, ms('30s')))
      timeout = setTimeout(getOrderStatuses, currentDelay)
    }

    if (!realtimeEnabled) {
      timeout = setTimeout(getOrderStatuses, currentDelay)
      return () => clearTimeout(timeout)
    }
    return
  }, [account.address, currentDelay, onActivityUpdate, pendingOrders, provider, realtimeEnabled])

  return null
}
