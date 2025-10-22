import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useAccount } from 'hooks/useAccount'
import ms from 'ms'
import { useEffect, useRef, useState } from 'react'
import { ActivityUpdateTransactionType, OnActivityUpdate } from 'state/activity/types'
import { usePendingUniswapXOrders } from 'state/transactions/hooks'
import { OrderQueryResponse, UniswapXBackendOrder } from 'types/uniswapx'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import {
  ExactInputSwapTransactionInfo,
  TransactionStatus,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { isFinalizedTxStatus } from 'uniswap/src/features/transactions/types/utils'
import { convertOrderStatusToTransactionStatus } from 'uniswap/src/features/transactions/utils/uniswapX.utils'
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

async function fetchStatuses({
  endpoint,
  orders,
  swapper,
}: {
  endpoint: 'limit-orders' | 'orders'
  orders: UniswapXOrderDetails[]
  swapper: string
}): Promise<UniswapXBackendOrder[]> {
  const hashes = orders.map((order) => order.orderHash)
  if (hashes.length === 0) {
    return []
  }

  const result = await global.fetch(`${UNISWAP_GATEWAY_DNS_URL}/${endpoint}?swapper=${swapper}&orderHashes=${hashes}`)
  const statuses = (await result.json()) as OrderQueryResponse
  return statuses.orders
}

export async function fetchOpenLimitOrders(params: {
  account?: string
  orderHashes?: string[]
}): Promise<UniswapXBackendOrder[]> {
  let url = `${UNISWAP_GATEWAY_DNS_URL}${uniswapUrls.limitOrderStatusesPath}`
  const queryParams: string[] = []

  if (params.account) {
    queryParams.push(`swapper=${params.account}`)
    queryParams.push('orderStatus=open')
  }

  if (params.orderHashes && params.orderHashes.length > 0) {
    queryParams.push(`orderHashes=${params.orderHashes.join(',')}`)
  }

  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`
  }

  const result = await global.fetch(url)
  const statuses = (await result.json()) as OrderQueryResponse
  return statuses.orders
}

async function fetchLimitStatuses(account: string, orders: UniswapXOrderDetails[]): Promise<UniswapXBackendOrder[]> {
  const limitOrders = orders.filter((order) => order.routing === TradingApi.Routing.DUTCH_LIMIT)
  return fetchStatuses({ endpoint: 'limit-orders', orders: limitOrders, swapper: account })
}

async function fetchOrderStatuses(account: string, orders: UniswapXOrderDetails[]): Promise<UniswapXBackendOrder[]> {
  const uniswapXOrders = orders.filter((order) => order.routing !== TradingApi.Routing.DUTCH_LIMIT)
  return fetchStatuses({ endpoint: 'orders', orders: uniswapXOrders, swapper: account })
}

function updateOrders({
  pendingOrders,
  statuses,
  onActivityUpdate,
}: {
  pendingOrders: UniswapXOrderDetails[]
  statuses: UniswapXBackendOrder[]
  onActivityUpdate: OnActivityUpdate
}) {
  pendingOrders.forEach((pendingOrder) => {
    const updatedOrder = statuses.find((order) => order.orderHash === pendingOrder.orderHash)
    if (!updatedOrder) {
      return
    }

    const transactionStatus = convertOrderStatusToTransactionStatus(updatedOrder.orderStatus)

    // Skip update if status hasn't changed
    if (pendingOrder.status === transactionStatus) {
      return
    }

    // Guard against downgrading from Cancelling to Pending
    // This prevents the poller from overwriting user-initiated cancellation status
    // Orders in "Cancelling" state should only transition to Success, Failed, or remain Cancelling
    if (pendingOrder.status === TransactionStatus.Cancelling && transactionStatus === TransactionStatus.Pending) {
      return
    }

    const updatedTransaction: UniswapXOrderDetails = {
      ...pendingOrder,
      status: transactionStatus,
      hash:
        transactionStatus === TransactionStatus.Success && 'txHash' in updatedOrder
          ? updatedOrder.txHash
          : pendingOrder.hash,
      typeInfo: { ...pendingOrder.typeInfo },
    }

    if (
      transactionStatus === TransactionStatus.Success &&
      'settledAmounts' in updatedOrder &&
      updatedOrder.settledAmounts?.[0]?.amountOut
    ) {
      // UniswapX orders always have swap typeInfo with tradeType
      if ('tradeType' in pendingOrder.typeInfo && pendingOrder.typeInfo.tradeType === TradeType.EXACT_INPUT) {
        const exactInputTypeInfo = updatedTransaction.typeInfo as ExactInputSwapTransactionInfo
        exactInputTypeInfo.settledOutputCurrencyAmountRaw = updatedOrder.settledAmounts[0].amountOut
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if ('tradeType' in pendingOrder.typeInfo && pendingOrder.typeInfo.tradeType === TradeType.EXACT_OUTPUT) {
        // TODO(WEB-3962): Handle settled EXACT_OUTPUT amounts
      }
    }

    onActivityUpdate({
      type: ActivityUpdateTransactionType.UniswapXOrder,
      chainId: pendingOrder.chainId,
      original: pendingOrder,
      update: updatedTransaction,
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

      if (l2Orders.every((order) => isFinalizedTxStatus(order.status))) {
        clearTimeout(timeout)
        return
      }

      try {
        const statuses = await fetchOrderStatuses(account.address, l2Orders)
        updateOrders({ pendingOrders, statuses, onActivityUpdate })

        const earliestOrder = l2Orders.find((order) => !isFinalizedTxStatus(order.status))
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

      if (mainnetOrders.every((order) => isFinalizedTxStatus(order.status))) {
        clearTimeout(timeout)
        return
      }

      try {
        const statuses = await Promise.all([
          fetchOrderStatuses(account.address, mainnetOrders),
          fetchLimitStatuses(account.address, mainnetOrders),
        ]).then((results) => results.flat())

        updateOrders({ pendingOrders, statuses, onActivityUpdate })
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
  const pendingOrders = usePendingUniswapXOrders()

  useQuickPolling({ account, pendingOrders, onActivityUpdate })
  useStandardPolling({ account, pendingOrders, onActivityUpdate })

  return null
}
