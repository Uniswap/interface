import { TradeType } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import ms from 'ms'
import { useEffect, useRef, useState } from 'react'
import { OnActivityUpdate, OrderUpdate } from 'state/activity/types'
import { isFinalizedOrder, usePendingOrders } from 'state/signatures/hooks'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { ExactInputSwapTransactionInfo } from 'state/transactions/types'
import { OrderQueryResponse, UniswapXBackendOrder, UniswapXOrderStatus } from 'types/uniswapx'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { logger } from 'utilities/src/logger/logger'

const STANDARD_POLLING_INITIAL_INTERVAL = ms(`2s`)
const STANDARD_POLLING_MAX_INTERVAL = ms('30s')

// Quick polling constants
export const QUICK_POLL_INITIAL_INTERVAL = ms('500ms')
export const QUICK_POLL_MEDIUM_INTERVAL = ms('2s')
export const QUICK_POLL_MAX_INTERVAL = ms('30s')
export const QUICK_POLL_INITIAL_PHASE = ms('10s')
export const QUICK_POLL_MEDIUM_PHASE = ms('200s')

const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

export function getQuickPollingInterval(orderStartTime: number) {
  const elapsedTime = Date.now() - orderStartTime
  if (elapsedTime < QUICK_POLL_INITIAL_PHASE) {
    return QUICK_POLL_INITIAL_INTERVAL
  } else if (elapsedTime < QUICK_POLL_MEDIUM_PHASE) {
    return QUICK_POLL_MEDIUM_INTERVAL
  }
  return QUICK_POLL_MAX_INTERVAL
}

async function fetchStatuses(
  endpoint: 'limit-orders' | 'orders',
  orders: UniswapXOrderDetails[],
  swapper: string,
): Promise<UniswapXBackendOrder[]> {
  const hashes = orders.map((order) => order.orderHash)
  if (hashes.length === 0) {
    return []
  }

  const result = await global.fetch(`${UNISWAP_GATEWAY_DNS_URL}/${endpoint}?swapper=${swapper}&orderHashes=${hashes}`)
  const statuses = (await result.json()) as OrderQueryResponse
  return statuses.orders
}

async function fetchLimitStatuses(account: string, orders: UniswapXOrderDetails[]): Promise<UniswapXBackendOrder[]> {
  const limitOrders = orders.filter((order) => order.type === SignatureType.SIGN_LIMIT)
  return fetchStatuses('limit-orders', limitOrders, account)
}

async function fetchOrderStatuses(account: string, orders: UniswapXOrderDetails[]): Promise<UniswapXBackendOrder[]> {
  const uniswapXOrders = orders.filter((order) => order.type !== SignatureType.SIGN_LIMIT)
  return fetchStatuses('orders', uniswapXOrders, account)
}

function updateOrders(
  pendingOrders: UniswapXOrderDetails[],
  statuses: UniswapXBackendOrder[],
  onActivityUpdate: OnActivityUpdate,
) {
  pendingOrders.forEach((pendingOrder) => {
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
}

function useQuickPolling({
  account,
  pendingOrders,
  onActivityUpdate,
}: {
  account: { address?: string }
  pendingOrders: UniswapXOrderDetails[]
  onActivityUpdate: OnActivityUpdate
}) {
  const [delay, setDelay] = useState(QUICK_POLL_INITIAL_INTERVAL)

  const pendingOrdersRef = useRef(pendingOrders)

  useEffect(() => {
    if (pendingOrders.length > pendingOrdersRef.current.length) {
      setDelay(QUICK_POLL_INITIAL_INTERVAL)
    }
    pendingOrdersRef.current = pendingOrders
  }, [pendingOrders])

  useEffect(() => {
    let timeout: NodeJS.Timeout

    async function poll() {
      const l2Orders = pendingOrders.filter((order) => isL2ChainId(order.chainId))
      if (!account.address || l2Orders.length === 0) {
        return
      }

      if (l2Orders.every((order) => isFinalizedOrder(order))) {
        clearTimeout(timeout)
        return
      }

      try {
        const statuses = await fetchOrderStatuses(account.address, l2Orders)
        updateOrders(pendingOrders, statuses, onActivityUpdate)

        const earliestOrder = l2Orders.find((order) => !isFinalizedOrder(order))
        if (earliestOrder) {
          const newDelay = getQuickPollingInterval(earliestOrder.addedTime)
          setDelay(newDelay)
          timeout = setTimeout(poll, newDelay)
        }
      } catch (e) {
        logger.debug('useQuickPolling', 'poll', 'Failed to fetch order statuses', e)
        timeout = setTimeout(poll, delay)
      }
    }

    timeout = setTimeout(poll, delay)
    return () => clearTimeout(timeout)
  }, [account.address, delay, onActivityUpdate, pendingOrders])
}

function useStandardPolling({
  account,
  pendingOrders,
  onActivityUpdate,
}: {
  account: { address?: string }
  pendingOrders: UniswapXOrderDetails[]
  onActivityUpdate: OnActivityUpdate
}) {
  const [delay, setDelay] = useState(STANDARD_POLLING_INITIAL_INTERVAL)
  const pendingOrdersRef = useRef(pendingOrders)

  useEffect(() => {
    if (pendingOrders.length > pendingOrdersRef.current.length) {
      setDelay(STANDARD_POLLING_INITIAL_INTERVAL)
    }
    pendingOrdersRef.current = pendingOrders
  }, [pendingOrders])

  useEffect(() => {
    let timeout: NodeJS.Timeout

    async function poll() {
      const mainnetOrders = pendingOrders.filter((order) => !isL2ChainId(order.chainId))
      if (!account.address || mainnetOrders.length === 0) {
        return
      }

      if (mainnetOrders.every((order) => isFinalizedOrder(order))) {
        clearTimeout(timeout)
        return
      }

      try {
        const statuses = await Promise.all([
          fetchOrderStatuses(account.address, mainnetOrders),
          fetchLimitStatuses(account.address, mainnetOrders),
        ]).then((results) => results.flat())

        updateOrders(pendingOrders, statuses, onActivityUpdate)
        const newDelay = Math.min(delay * 1.5, STANDARD_POLLING_MAX_INTERVAL)
        setDelay(newDelay)
        timeout = setTimeout(poll, newDelay)
      } catch (e) {
        logger.debug('useStandardPolling', 'poll', 'Failed to fetch order statuses', e)
        timeout = setTimeout(poll, delay)
      }
    }

    timeout = setTimeout(poll, delay)
    return () => clearTimeout(timeout)
  }, [account.address, delay, onActivityUpdate, pendingOrders])
}

export function usePollPendingOrders(onActivityUpdate: OnActivityUpdate) {
  const account = useAccount()
  const pendingOrders = usePendingOrders()

  useQuickPolling({ account, pendingOrders, onActivityUpdate })
  useStandardPolling({ account, pendingOrders, onActivityUpdate })

  return null
}
