import { NetworkStatus } from '@apollo/client'
import { createPromiseClient } from '@connectrpc/connect'
import { useInfiniteQuery } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import { transformInput } from '@universe/api'
import { useEffect, useMemo, useRef } from 'react'
import { uniswapGetTransport } from 'uniswap/src/data/rest/base'
import { parseRestResponseToTransactionDetails } from 'uniswap/src/features/activity/parseRestResponse'
import { LIMIT_SUPPORTED_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { BaseResult } from 'uniswap/src/features/dataApi/types'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isLimitOrder } from 'uniswap/src/features/transactions/utils/uniswapX.utils'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const PAGE_SIZE = 100
const PAGE_NUMBER_LIMIT = 10

/**
 * Custom hook that fetches all limit orders from REST API with pagination support
 * Uses infinite query to automatically handle pagination
 */
export function useOpenLimitOrders({
  evmAddress,
  svmAddress,
}: {
  evmAddress: string
  svmAddress?: string
}): BaseResult<UniswapXOrderDetails[]> {
  const client = useMemo(() => createPromiseClient(DataApiService, uniswapGetTransport), [])

  const { data, isLoading, isFetchingNextPage, error, refetch, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: [ReactQueryCacheKey.ListTransactions, evmAddress, svmAddress, 'limit-orders'],
    queryFn: async ({ pageParam }) => {
      const input = transformInput({
        evmAddress,
        svmAddress,
        chainIds: LIMIT_SUPPORTED_CHAINS,
        pageSize: PAGE_SIZE,
        pageToken: pageParam,
      })

      if (!input) {
        throw new Error('Failed to transform input')
      }

      return client.listTransactions(input)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Validate the nextPageToken before returning it
      if (!lastPage.nextPageToken) {
        return undefined
      }

      try {
        const decodedToken = JSON.parse(atob(lastPage.nextPageToken))
        if (!decodedToken.onChainCursor || decodedToken.onChainCursor === '') {
          return undefined
        }
      } catch (e) {
        logger.warn('useOpenLimitOrders', 'getNextPageParam', `Invalid pageToken received: ${lastPage.nextPageToken}`, {
          error: e,
        })
        return undefined
      }

      return lastPage.nextPageToken
    },
    enabled: !!(evmAddress || svmAddress),
    maxPages: PAGE_NUMBER_LIMIT,
  })

  // Store fetchNextPage in a ref to avoid it being a dependency
  const fetchNextPageRef = useRef(fetchNextPage)
  fetchNextPageRef.current = fetchNextPage

  // Automatically fetch all pages on mount
  // React Query will handle deduplication and prevent race conditions
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPageRef.current().catch((err) => {
        logger.error(err, {
          tags: { file: 'useOpenLimitOrders', function: 'autoFetchNextPage' },
          extra: { message: 'Failed to fetch next page automatically' },
        })
      })
    }
  }, [hasNextPage, isFetchingNextPage, isLoading])

  // Extract and deduplicate all limit orders from all pages
  const allLimitOrders = useMemo(() => {
    if (!data?.pages) {
      return []
    }

    const allOrders: UniswapXOrderDetails[] = []
    const seenIds = new Set<string>()

    for (const page of data.pages) {
      const transactions = parseRestResponseToTransactionDetails({
        data: page,
        hideSpamTokens: false,
      })

      const limitOrders = transactions?.filter(
        (tx): tx is UniswapXOrderDetails => isLimitOrder(tx) && tx.status === TransactionStatus.Pending,
      )

      if (limitOrders) {
        for (const order of limitOrders) {
          if (!seenIds.has(order.id)) {
            seenIds.add(order.id)
            allOrders.push(order)
          }
        }
      }
    }

    return allOrders
  }, [data?.pages])

  return {
    data: allLimitOrders,
    loading: isLoading || isFetchingNextPage,
    error: error ?? undefined,
    networkStatus:
      isLoading || isFetchingNextPage ? NetworkStatus.loading : error ? NetworkStatus.error : NetworkStatus.ready,
    refetch,
  }
}
