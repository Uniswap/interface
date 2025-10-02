import { PartialMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { FiatOnRampParams } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useEffect, useMemo, useRef, useState } from 'react'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import { useListTransactionsQuery } from 'uniswap/src/data/rest/listTransactions'
import { transformInput } from 'uniswap/src/data/rest/utils'
import { parseRestResponseToTransactionDetails } from 'uniswap/src/features/activity/parseRestResponse'
import { LIMIT_SUPPORTED_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { mapRestStatusToNetworkStatus } from 'uniswap/src/features/dataApi/balances/utils'
import { BaseResult } from 'uniswap/src/features/dataApi/types'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isLimitOrder } from 'uniswap/src/features/transactions/utils/uniswapX.utils'
import { CurrencyIdToVisibility, NFTKeyToVisibility } from 'uniswap/src/features/visibility/slice'
import { logger } from 'utilities/src/logger/logger'

export interface OpenLimitOrdersResult extends BaseResult<UniswapXOrderDetails[]> {
  isFetchingMore: boolean
}

const PAGE_SIZE = 50
const PAGE_NUMBER_LIMIT = 20

interface FetchOpenLimitOrdersParams {
  account: string
  svmAddress?: string
  chainIds?: UniverseChainId[]
  hideSpamTokens?: boolean
  tokenVisibilityOverrides?: CurrencyIdToVisibility
  nftVisibility?: NFTKeyToVisibility
  fiatOnRampParams?: PartialMessage<FiatOnRampParams>
  initialPageToken?: string
}

const transactionsClient = createPromiseClient(DataApiService, uniswapGetTransport)

/**
 * Helper function to deduplicate limit orders by their order ID
 */
function deduplicateLimitOrders(orders: UniswapXOrderDetails[]): UniswapXOrderDetails[] {
  const seenIds = new Set<string>()
  return orders.filter((order) => {
    if (seenIds.has(order.id)) {
      return false
    }
    seenIds.add(order.id)
    return true
  })
}

/**
 * Fetches all open limit orders for an account by paginating through REST API results
 * Used by both AssetActivityProvider and useOpenLimitOrders hook
 */
export async function fetchOpenLimitOrders({
  account,
  svmAddress,
  chainIds = LIMIT_SUPPORTED_CHAINS,
  hideSpamTokens = false,
  tokenVisibilityOverrides,
  nftVisibility,
  fiatOnRampParams,
  initialPageToken,
}: FetchOpenLimitOrdersParams): Promise<UniswapXOrderDetails[]> {
  const limitOrders: UniswapXOrderDetails[] = []
  const seenOrderIds = new Set<string>()
  let pageToken: string | undefined = initialPageToken
  let pageCount = 0
  let consecutiveEmptyPages = 0

  try {
    while (pageCount < PAGE_NUMBER_LIMIT) {
      const input = transformInput({
        evmAddress: account,
        svmAddress,
        chainIds,
        pageSize: PAGE_SIZE,
        pageToken,
        fiatOnRampParams,
      })

      if (!input) {
        break
      }

      const response = await transactionsClient.listTransactions(input)

      const transactions = parseRestResponseToTransactionDetails({
        data: response,
        hideSpamTokens,
        nftVisibility,
        tokenVisibilityOverrides,
      })

      // Extract limit orders from this page
      const pageLimitOrders =
        transactions?.filter(
          (tx): tx is UniswapXOrderDetails => isLimitOrder(tx) && tx.status === TransactionStatus.Pending,
        ) || []

      // Deduplicate orders before adding them
      let newOrdersAdded = 0
      for (const order of pageLimitOrders) {
        if (!seenOrderIds.has(order.id)) {
          seenOrderIds.add(order.id)
          limitOrders.push(order)
          newOrdersAdded++
        }
      }

      // If we got no new unique orders, increment empty page counter
      if (newOrdersAdded === 0) {
        consecutiveEmptyPages++
        // Stop if we've seen multiple pages with no new orders
        if (consecutiveEmptyPages >= 2) {
          break
        }
      } else {
        consecutiveEmptyPages = 0
      }

      // Check if there are more pages - stop if no nextPageToken or if we got no transactions
      if (!response.nextPageToken || !transactions || transactions.length === 0) {
        break
      }

      // Validate the nextPageToken before using it
      // Skip if the token appears to be malformed or empty
      try {
        const decodedToken = JSON.parse(atob(response.nextPageToken))
        if (!decodedToken.onChainCursor || decodedToken.onChainCursor === '') {
          // Empty cursor means no more data
          break
        }
      } catch (e) {
        // If we can't decode the token, log it and stop pagination
        logger.warn(
          'useOpenLimitOrders',
          'fetchOpenLimitOrders',
          `Invalid pageToken received: ${response.nextPageToken}`,
          { error: e },
        )
        break
      }

      pageToken = response.nextPageToken
      pageCount++
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'useOpenLimitOrders', function: 'fetchOpenLimitOrders' },
      extra: { message: 'Failed to fetch all open limit orders' },
    })
    throw error
  }

  return limitOrders
}

/**
 * Custom hook that fetches all limit orders from REST API with pagination support
 */
export function useOpenLimitOrders({
  evmAddress,
  svmAddress,
}: {
  evmAddress: string
  svmAddress?: string
}): OpenLimitOrdersResult {
  const [additionalLimitOrders, setAdditionalLimitOrders] = useState<UniswapXOrderDetails[]>([])
  const [isLoadingAdditional, setIsLoadingAdditional] = useState(false)
  const [firstPageNextToken, setFirstPageNextToken] = useState<string | undefined>()
  const [shouldFetchMore, setShouldFetchMore] = useState(false)

  // Use refs to prevent race conditions
  const fetchInProgressRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fetch first page raw response to get nextPageToken
  const {
    data: firstPageRawData,
    isLoading: firstPageLoading,
    error: firstPageError,
    status: restStatus,
    refetch,
  } = useListTransactionsQuery({
    input: {
      evmAddress,
      svmAddress,
      chainIds: LIMIT_SUPPORTED_CHAINS,
      pageSize: PAGE_SIZE,
    },
    enabled: !!(evmAddress || svmAddress),
  })

  // Parse first page transactions and extract limit orders
  const firstPageTransactions = useMemo(() => {
    if (!firstPageRawData) {
      return undefined
    }
    return parseRestResponseToTransactionDetails({
      data: firstPageRawData,
      hideSpamTokens: false,
    })
  }, [firstPageRawData])

  // Extract limit orders from first page
  const firstPageLimitOrders = useMemo(() => {
    if (!firstPageTransactions) {
      return []
    }
    return firstPageTransactions.filter(
      (tx): tx is UniswapXOrderDetails => isLimitOrder(tx) && tx.status === TransactionStatus.Pending,
    )
  }, [firstPageTransactions])

  // Determine if we need to fetch additional pages when first page loads
  useEffect(() => {
    if (!firstPageRawData) {
      setShouldFetchMore(false)
      setFirstPageNextToken(undefined)
      return
    }

    const hasNextPage = !!firstPageRawData.nextPageToken

    // If no next page token, we have all the data
    if (!hasNextPage) {
      setShouldFetchMore(false)
      setAdditionalLimitOrders([])
      setFirstPageNextToken(undefined)
      return
    }

    // Optimization: If first page has no limit orders, skip pagination
    // (unlikely to have limit orders in later pages)
    if (firstPageLimitOrders.length === 0) {
      setShouldFetchMore(false)
      setAdditionalLimitOrders([])
      setFirstPageNextToken(undefined)
      return
    }

    // We need to fetch more pages
    setFirstPageNextToken(firstPageRawData.nextPageToken)
    setShouldFetchMore(true)
  }, [firstPageRawData, firstPageLimitOrders])

  // Fetch additional pages if needed
  useEffect(() => {
    // Skip if we don't need to fetch more or if a fetch is already in progress
    if (!shouldFetchMore || !firstPageNextToken || !evmAddress || fetchInProgressRef.current) {
      return undefined
    }

    // Abort any existing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Mark fetch as in progress
    fetchInProgressRef.current = true
    setIsLoadingAdditional(true)

    const fetchAdditionalOrders = async (): Promise<void> => {
      try {
        // Fetch additional limit orders starting from the next page
        const additionalOrders = await fetchOpenLimitOrders({
          account: evmAddress,
          svmAddress,
          chainIds: LIMIT_SUPPORTED_CHAINS,
          initialPageToken: firstPageNextToken,
        })

        // Only update state if not aborted
        if (!abortController.signal.aborted) {
          // Deduplicate against first page orders
          const firstPageIds = new Set(firstPageLimitOrders.map((order) => order.id))
          const uniqueAdditionalOrders = additionalOrders.filter((order) => !firstPageIds.has(order.id))
          setAdditionalLimitOrders(uniqueAdditionalOrders)
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          logger.error(error, {
            tags: { file: 'useOpenLimitOrders', function: 'fetchAdditionalOrders' },
            extra: { message: 'Failed to fetch additional limit orders' },
          })
          setAdditionalLimitOrders([])
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingAdditional(false)
          fetchInProgressRef.current = false
        }
      }
    }

    fetchAdditionalOrders().catch((error) => {
      logger.error(error, {
        tags: { file: 'useOpenLimitOrders', function: 'useEffect' },
        extra: { message: 'Error in fetchAdditionalOrders' },
      })
    })

    // Cleanup function
    return () => {
      abortController.abort()
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [shouldFetchMore, firstPageNextToken, evmAddress, svmAddress, firstPageLimitOrders])

  // Combine first page and additional limit orders with final deduplication
  const allLimitOrders = useMemo(() => {
    const combined = [...firstPageLimitOrders, ...additionalLimitOrders]
    return deduplicateLimitOrders(combined)
  }, [firstPageLimitOrders, additionalLimitOrders])

  return {
    data: allLimitOrders,
    loading: firstPageLoading, // Only true for initial load
    isFetchingMore: isLoadingAdditional, // True when fetching additional pages
    error: firstPageError ?? undefined,
    networkStatus: mapRestStatusToNetworkStatus(restStatus),
    refetch,
  }
}
