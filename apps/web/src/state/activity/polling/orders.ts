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

function isUniswapXOrder(order: UniswapXOrderDetails): boolean {
  return (
    order.type === SignatureType.SIGN_UNISWAPX_ORDER ||
    order.type === SignatureType.SIGN_UNISWAPX_V2_ORDER ||
    order.type === SignatureType.SIGN_UNISWAPX_V3_ORDER
  )
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
  return fetchStatuses(orders, isUniswapXOrder, (hashes) => `/orders?swapper=${account}&orderHashes=${hashes}`)
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
      if (!account.address || pendingOrders.length === 0) {
        return
      }

      const orders = pendingOrders.filter(
        (order) =>
          (isUniswapXOrder(order) && isL2ChainId(order.chainId)) || order.type === SignatureType.SIGN_PRIORITY_ORDER,
      )
      if (orders.length === 0) {
        return
      }

      if (orders.every((order) => isFinalizedOrder(order))) {
        clearTimeout(timeout)
        return
      }

      try {
        const statuses = await Promise.all([fetchOrderStatuses(account.address, orders.filter(isUniswapXOrder))]).then(
          (results) => results.flat(),
        )

        updateOrders(pendingOrders, statuses, onActivityUpdate)

        const earliestOrder = orders.find((order) => !isFinalizedOrder(order))
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
      if (!account.address || pendingOrders.length === 0) {
        return
      }

      const orders = pendingOrders.filter(
        (order) => (isUniswapXOrder(order) && !isL2ChainId(order.chainId)) || order.type === SignatureType.SIGN_LIMIT,
      )
      if (orders.length === 0) {
        return
      }

      if (orders.every((order) => isFinalizedOrder(order))) {
        clearTimeout(timeout)
        return
      }

      try {
        const statuses = await Promise.all([
          fetchOrderStatuses(account.address, orders.filter(isUniswapXOrder)),
          fetchLimitStatuses(
            account.address,
            orders.filter((order) => order.type === SignatureType.SIGN_LIMIT),
          ),
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

  useQuickPolling({
    account,
    pendingOrders,
    onActivityUpdate,
  })

  useStandardPolling({
    account,
    pendingOrders,
    onActivityUpdate,
  })

  return null
}
