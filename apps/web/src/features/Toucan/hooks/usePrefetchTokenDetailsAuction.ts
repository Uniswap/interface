import { useQueryClient } from '@tanstack/react-query'
import type { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag, useStatsigClientStatus } from '@universe/gating'
import { useCallback } from 'react'
import { getTdpAuctionQueryOptions, getTdpAuctionRequest } from '~/features/Toucan/utils/tdpAuctionQueryOptions'

type AuctionToken = { chainId: UniverseChainId; tokenAddress: string }

export function usePrefetchTokenDetailsAuction(): (token: AuctionToken) => void {
  const queryClient = useQueryClient()
  const featureEnabled = useFeatureFlag(FeatureFlags.TokenProvenance)
  const { isStatsigReady } = useStatsigClientStatus()

  return useCallback(
    (token: AuctionToken) => {
      if (!isStatsigReady || !featureEnabled) {
        return
      }
      const params = getTdpAuctionRequest(token)
      if (params) {
        void queryClient.prefetchQuery(getTdpAuctionQueryOptions({ params, enabled: true })).catch(() => {})
      }
    },
    [featureEnabled, isStatsigReady, queryClient],
  )
}
