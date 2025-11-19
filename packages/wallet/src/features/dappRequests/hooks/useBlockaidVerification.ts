import { useQuery } from '@tanstack/react-query'
import { BlockaidApiClient } from 'uniswap/src/data/apiClients/blockaidApi/BlockaidApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { DappVerificationStatus } from 'wallet/src/features/dappRequests/types'

const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS

interface UseBlockaidVerificationResult {
  verificationStatus?: DappVerificationStatus
  isLoading: boolean
}

/**
 * Hook to verify a dapp URL using Blockaid's site scanning API
 * @param url The dapp URL to verify
 * @returns Verification status and loading state
 */
export function useBlockaidVerification(url: string): UseBlockaidVerificationResult {
  const { data: verificationStatus, isLoading } = useQuery({
    queryKey: [ReactQueryCacheKey.BlockaidVerification, url],
    queryFn: () => BlockaidApiClient.scanSite(url),
    staleTime: FIVE_MINUTES_MS,
    enabled: Boolean(url),
    // Don't retry on failures - we want to fail fast and show unverified
    retry: false,
  })

  return {
    verificationStatus,
    isLoading,
  }
}
