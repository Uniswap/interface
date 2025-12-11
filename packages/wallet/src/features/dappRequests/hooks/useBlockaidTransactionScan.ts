import { hashKey, useQuery } from '@tanstack/react-query'
import { BlockaidScanTransactionRequest, BlockaidScanTransactionResponse } from '@universe/api'
import { BlockaidApiClient } from 'uniswap/src/data/apiClients/blockaidApi/BlockaidApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS

interface UseBlockaidTransactionScanResult {
  scanResult?: BlockaidScanTransactionResponse | null
  isLoading: boolean
}

/**
 * Creates an efficient cache key from a transaction scan request.
 * @param request The transaction scan request or null
 * @returns An array of cache key components, or an array with null if request is null
 */
function createTransactionScanCacheKey(request: BlockaidScanTransactionRequest | null): unknown[] {
  if (!request) {
    return [null]
  }

  // Hash the transaction data object to avoid storing large hex strings in cache keys
  const dataHash = hashKey([request.data])

  return [request.chain, request.account_address, request.metadata.domain, dataHash]
}

/**
 * Hook to scan a transaction using Blockaid's API
 * @param request The transaction scan request parameters
 * @param enabled Whether the query should be enabled
 * @returns Transaction scan result and loading state
 */
export function useBlockaidTransactionScan(
  request: BlockaidScanTransactionRequest | null,
  enabled = true,
): UseBlockaidTransactionScanResult {
  const { data: scanResult, isLoading } = useQuery({
    queryKey: [ReactQueryCacheKey.BlockaidTransactionScan, ...createTransactionScanCacheKey(request)],
    queryFn: () => BlockaidApiClient.scanTransaction(request),
    staleTime: FIVE_MINUTES_MS,
    enabled: enabled && Boolean(request),
    // Don't retry on failures - we want to fail fast and show null
    retry: false,
  })

  return {
    scanResult,
    isLoading,
  }
}
