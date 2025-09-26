import { TransactionRequest } from '@ethersproject/abstract-provider'
import { Web3Provider } from '@ethersproject/providers'
import { useQuery } from '@tanstack/react-query'
import { permit2Address } from '@uniswap/permit2-sdk'
import {
  CosignedPriorityOrder,
  CosignedV2DutchOrder,
  CosignedV3DutchOrder,
  DutchOrder,
  getCancelMultipleParams,
} from '@uniswap/uniswapx-sdk'
import { TradingApi } from '@universe/api'
import { hasEncodedOrder } from 'components/AccountDrawer/MiniPortfolio/Activity/utils'
import { ContractTransaction } from 'ethers/lib/ethers'
import { useAccount } from 'hooks/useAccount'
import { useContract } from 'hooks/useContract'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import useSelectChain from 'hooks/useSelectChain'
import { useCallback, useMemo } from 'react'
import store from 'state'
import { useAppDispatch } from 'state/hooks'
import PERMIT2_ABI from 'uniswap/src/abis/permit2.json'
import { Permit2 } from 'uniswap/src/abis/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { updateTransaction } from 'uniswap/src/features/transactions/slice'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getContract } from 'utilities/src/contracts/getContract'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'
import { WrongChainError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

type AppDispatch = typeof store.dispatch

/**
 * Validates that orders can be cancelled together
 * @returns validation result with chainId if valid
 */
function validateOrdersForCancellation(orders: UniswapXOrderDetails[]): {
  valid: boolean
  error?: string
  chainId?: UniverseChainId
} {
  if (orders.length === 0) {
    return { valid: false, error: 'No orders provided' }
  }

  const firstChainId = orders[0].chainId
  if (!orders.every((order) => order.chainId === firstChainId)) {
    return { valid: false, error: 'Cannot cancel orders from different chains' }
  }

  return { valid: true, chainId: firstChainId }
}

/**
 * Sends analytics event for order cancellation
 */
function trackOrderCancellation(orders: UniswapXOrderDetails[]): void {
  const orderHashes = orders.map((order) => order.orderHash).filter((hash): hash is string => hash !== undefined)

  sendAnalyticsEvent(InterfaceEventName.UniswapXOrderCancelInitiated, {
    orders: orderHashes,
  })
}

/**
 * Type guard to check if an order has all required data for cancellation
 */
function hasValidCancellationData(order: UniswapXOrderDetails): order is UniswapXOrderDetails & {
  orderHash: string
  encodedOrder: string
  routing: TradingApi.Routing
} {
  return hasEncodedOrder(order) && order.orderHash !== undefined
}

/**
 * Extracts cancellation data from orders that have all required fields.
 * Returns the data needed to execute the cancellation transaction.
 * No network calls are made here; callers should ensure data is present upstream.
 */
function extractCancellationData(
  orders: UniswapXOrderDetails[],
): Array<{ orderHash: string; encodedOrder: string; routing: TradingApi.Routing }> {
  return orders.filter(hasValidCancellationData).map((order) => ({
    orderHash: order.orderHash,
    encodedOrder: order.encodedOrder,
    routing: order.routing,
  }))
}

/**
 * Filters orders to only include those that can be cancelled
 * based on the available cancellation data
 */
function getOrdersMatchingCancellationData(
  allOrders: UniswapXOrderDetails[],
  cancellationData: Array<{ orderHash: string }>,
): UniswapXOrderDetails[] {
  const cancellableHashes = new Set(cancellationData.map((order) => order.orderHash))
  return allOrders.filter((order) => order.orderHash && cancellableHashes.has(order.orderHash))
}

/**
 * Updates order status to Cancelling for UI feedback
 */
function markOrdersAsCancelling(orders: UniswapXOrderDetails[], dispatch: AppDispatch): void {
  orders.forEach((order) => {
    dispatch(
      updateTransaction({
        ...order,
        status: TransactionStatus.Cancelling,
      }),
    )
  })
}

/**
 * Reverts order status to their original values on error
 */
function revertOrdersStatuses({
  orders,
  originalStatuses,
  dispatch,
}: {
  orders: UniswapXOrderDetails[]
  originalStatuses: Map<string | undefined, TransactionStatus>
  dispatch: AppDispatch
}): void {
  orders.forEach((order) => {
    const originalStatus = originalStatuses.get(order.orderHash) ?? order.status
    dispatch(
      updateTransaction({
        ...order,
        status: originalStatus,
      }),
    )
  })
}

function getCancelMultipleUniswapXOrdersParams(
  orders: Array<{ encodedOrder: string; routing: TradingApi.Routing }>,
  chainId: UniverseChainId,
) {
  const nonces = orders
    .map(({ encodedOrder, routing }) => {
      switch (routing) {
        case TradingApi.Routing.DUTCH_V2:
          return CosignedV2DutchOrder.parse(encodedOrder, chainId)
        case TradingApi.Routing.DUTCH_V3:
          return CosignedV3DutchOrder.parse(encodedOrder, chainId)
        case TradingApi.Routing.PRIORITY:
          return CosignedPriorityOrder.parse(encodedOrder, chainId)
        default:
          return DutchOrder.parse(encodedOrder, chainId)
      }
    })
    .map((order) => order.info.nonce)
  return getCancelMultipleParams(nonces)
}

async function cancelMultipleUniswapXOrders({
  orders,
  chainId,
  signer,
  provider,
  selectChain,
}: {
  orders: Array<{ encodedOrder: string; routing: TradingApi.Routing }>
  chainId: UniverseChainId
  signer?: string
  provider?: Web3Provider
  selectChain: (targetChain: UniverseChainId) => Promise<boolean>
}) {
  const cancelParams = getCancelMultipleUniswapXOrdersParams(orders, chainId)
  const permit2 =
    provider && getContract({ address: permit2Address(chainId), ABI: PERMIT2_ABI, provider, account: signer })
  if (!permit2) {
    return undefined
  }
  try {
    const switchChainResult = await selectChain(chainId)
    if (!switchChainResult) {
      throw new WrongChainError()
    }
    const transactions: ContractTransaction[] = []
    for (const params of cancelParams) {
      const tx = await permit2.invalidateUnorderedNonces(params.word, params.mask)
      transactions.push(tx)
    }
    return transactions
  } catch (error) {
    if (!didUserReject(error)) {
      logger.debug('utils', 'cancelMultipleUniswapXOrders', 'Failed to cancel multiple orders', { error, orders })
    }
    return undefined
  }
}

async function getCancelMultipleUniswapXOrdersTransaction({
  orders,
  chainId,
  permit2,
}: {
  orders: Array<{ encodedOrder: string; routing: TradingApi.Routing }>
  chainId: UniverseChainId
  permit2: Permit2
}): Promise<TransactionRequest | undefined> {
  const cancelParams = getCancelMultipleUniswapXOrdersParams(orders, chainId)
  if (cancelParams.length === 0) {
    return undefined
  }
  try {
    const tx = await permit2.populateTransaction.invalidateUnorderedNonces(cancelParams[0].word, cancelParams[0].mask)
    return {
      ...tx,
      chainId,
    }
  } catch (error) {
    const wrappedError = new Error('could not populate cancel transaction', { cause: error })
    logger.debug('utils', 'getCancelMultipleUniswapXOrdersTransaction', wrappedError.message, {
      error: wrappedError,
      orders,
    })
    return undefined
  }
}

export function useCreateCancelTransactionRequest(
  params:
    | {
        orders: Array<{ encodedOrder: string; routing: TradingApi.Routing }>
        chainId: UniverseChainId
      }
    | undefined,
): TransactionRequest | null | undefined {
  const permit2 = useContract<Permit2>({
    address: permit2Address(params?.chainId),
    ABI: PERMIT2_ABI,
  })
  const transactionFetcher = useCallback(() => {
    if (!params || params.orders.filter(({ encodedOrder }) => Boolean(encodedOrder)).length === 0 || !permit2) {
      return null
    }
    return getCancelMultipleUniswapXOrdersTransaction({
      orders: params.orders,
      chainId: params.chainId,
      permit2,
    })
  }, [params, permit2])

  return useQuery(
    queryWithoutCache({
      queryKey: [ReactQueryCacheKey.CancelTransactionRequest, params],
      queryFn: transactionFetcher,
    }),
  ).data
}

export function isLimitCancellable(order: UniswapXOrderDetails) {
  return order.status === TransactionStatus.Pending || order.status === TransactionStatus.InsufficientFunds
}

/**
 * Hook to cancel multiple UniswapX orders
 * Handles validation, fetching missing data, status updates, and execution
 */
export function useCancelMultipleOrdersCallback(
  orders?: Array<UniswapXOrderDetails>,
): () => Promise<ContractTransaction[] | undefined> {
  const account = useAccount()
  const selectChain = useSelectChain()
  const dispatch = useAppDispatch()

  // Validate orders once and reuse the result
  const validation = useMemo<{ valid: boolean; error?: string; chainId?: UniverseChainId }>(() => {
    if (!orders || orders.length === 0) {
      return { valid: false, error: 'No orders provided' }
    }
    return validateOrdersForCancellation(orders)
  }, [orders])

  // Use validated chainId for provider initialization
  // This ensures provider is configured for the correct chain
  const provider = useEthersWeb3Provider({ chainId: validation.chainId })

  return useCallback(async () => {
    if (!orders) {
      return undefined
    }

    // Check the pre-computed validation result
    if (validation.error) {
      logger.warn('cancel.utils', 'useCancelMultipleOrdersCallback', validation.error)
      return undefined
    }

    // Extract the data needed for cancellation (encodedOrder, routing, orderHash)
    // Only process orders that already have encodedOrder + orderHash available
    const cancellationData = extractCancellationData(orders)
    if (cancellationData.length === 0) {
      logger.warn('cancel.utils', 'useCancelMultipleOrdersCallback', 'No orders with required cancellation data found')
      return undefined
    }

    // Filter orders to only those that can actually be cancelled
    // Orders from GraphQL (both filled and pending) don't include encodedOrder since the backend
    // doesn't expose this sensitive data. Only locally-created orders that haven't been synced
    // with the backend will have encodedOrder populated, which is required for on-chain cancellation.
    // This ensures UI updates are only applied to orders that can actually be cancelled.
    const ordersToCancel = getOrdersMatchingCancellationData(orders, cancellationData)
    if (ordersToCancel.length === 0) {
      logger.warn('cancel.utils', 'useCancelMultipleOrdersCallback', 'No matching orders found to cancel')
      return undefined
    }

    // Store original statuses in case of cancellation reverts or errors
    const originalStatuses = new Map(ordersToCancel.map((order) => [order.orderHash, order.status]))

    try {
      // Track the cancellation attempt for analytics
      trackOrderCancellation(ordersToCancel)

      // Optimistically update UI to show orders are being cancelled
      markOrdersAsCancelling(ordersToCancel, dispatch)

      // Execute the actual cancellation transaction on-chain
      const txs = await cancelMultipleUniswapXOrders({
        orders: cancellationData.map(({ encodedOrder, routing }) => ({ encodedOrder, routing })),
        signer: account.address,
        provider,
        chainId: validation.chainId!,
        selectChain,
      })

      // Critical: Check if cancellation returned transactions
      // cancelMultipleUniswapXOrders can return undefined without throwing (e.g., user rejection, no provider)
      // Without this check, orders would remain stuck in "Cancelling" state
      if (!txs || txs.length === 0) {
        revertOrdersStatuses({ orders: ordersToCancel, originalStatuses, dispatch })
        logger.warn('cancel.utils', 'useCancelMultipleOrdersCallback', 'Cancellation returned no transactions')
        return undefined
      }

      return txs
    } catch (error) {
      // If cancellation fails, revert the UI status back to their original values
      revertOrdersStatuses({ orders: ordersToCancel, originalStatuses, dispatch })

      // Log the error (unless user explicitly rejected the transaction)
      if (!didUserReject(error)) {
        const captureContext = {
          tags: { file: 'cancel.utils.ts', function: 'useCancelMultipleOrdersCallback' },
          extra: { orders },
        }
        logger.error(error, captureContext)
      }
      return undefined
    }
  }, [orders, account.address, provider, selectChain, dispatch, validation.error, validation.chainId])
}
