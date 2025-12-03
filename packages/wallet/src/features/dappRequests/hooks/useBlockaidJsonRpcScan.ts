import { hashKey, useQuery } from '@tanstack/react-query'
import type { BlockaidScanJsonRpcRequest, BlockaidScanTransactionResponse } from '@universe/api'
import { BlockaidApiClient } from 'uniswap/src/data/apiClients/blockaidApi/BlockaidApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS

interface UseBlockaidJsonRpcScanResult {
  scanResult?: BlockaidScanTransactionResponse | null
  isLoading: boolean
}

/**
 * Creates an efficient cache key from a JSON-RPC scan request.
 * @param request The JSON-RPC scan request or null
 * @returns An array of cache key components, or an array with null if request is null
 */
function createJsonRpcScanCacheKey(request: BlockaidScanJsonRpcRequest | null): unknown[] {
  if (!request) {
    return [null]
  }

  // Hash the params array to avoid storing large hex strings in cache keys
  const paramsHash = hashKey([request.data.params])

  return [request.chain, request.account_address, request.metadata.domain, request.data.method, paramsHash]
}

/**
 * Hook to scan a signature request using Blockaid's JSON-RPC scan API
 * @param request The JSON-RPC scan request parameters
 * @param enabled Whether the query should be enabled
 * @returns Signature scan result and loading state
 */
export function useBlockaidJsonRpcScan(
  request: BlockaidScanJsonRpcRequest | null,
  enabled = true,
): UseBlockaidJsonRpcScanResult {
  const { data: scanResult, isLoading } = useQuery({
    queryKey: [ReactQueryCacheKey.BlockaidJsonRpcScan, ...createJsonRpcScanCacheKey(request)],
    queryFn: () => BlockaidApiClient.scanJsonRpc(request),
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
