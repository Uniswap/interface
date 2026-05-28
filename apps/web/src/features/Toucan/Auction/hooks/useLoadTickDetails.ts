import { useQuery } from '@tanstack/react-query'
import { GetTickDetailsRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

interface UseLoadTickDetailsParams {
  chainId: EVMUniverseChainId | undefined
  auctionAddress: string | undefined
}

/**
 * Fetches initialized-tick details from `GetTickDetails` and hydrates the store.
 * Gated behind `ToucanTickDetailsTooltip` — off means the query never runs.
 *
 * BE (`TickDetailsBL`) wraps the on-chain read in a 30s soft / 5m hard SWR cache,
 * so polling at the active-auction interval is safe.
 */
export function useLoadTickDetails({ chainId, auctionAddress }: UseLoadTickDetailsParams): void {
  const isEnabled = useFeatureFlag(FeatureFlags.ToucanTickDetailsTooltip)
  const { setTickDetails } = useAuctionStoreActions()
  const isAuctionActive = useAuctionStore((state) => state.progress.state === AuctionProgressState.IN_PROGRESS)

  const queryEnabled = isEnabled && Boolean(chainId && auctionAddress)

  const pollingInterval = useMemo(() => {
    if (!isAuctionActive || !chainId) {
      return false
    }
    return getPollingIntervalMs(chainId)
  }, [chainId, isAuctionActive])

  const { data, error: queryError } = useQuery(
    auctionQueries.getTickDetails({
      params: new GetTickDetailsRequest({
        chainId,
        address: auctionAddress,
      }),
      enabled: queryEnabled,
      refetchInterval: pollingInterval,
    }),
  )

  if (queryError) {
    logger.warn('useLoadTickDetails', 'useGetTickDetailsQuery', 'Failed to fetch tick details', {
      chainId,
      auctionAddress,
      error: queryError.message,
    })
  }

  useEffect(() => {
    if (!isEnabled) {
      return
    }
    if (!data) {
      return
    }
    // Response ordering is not guaranteed; sort ascending by priceQ96 so interpolation
    // lookups can use a single pass / binary search.
    const sorted = [...data.ticks].sort((a, b) => {
      const priceA = BigInt(a.priceQ96)
      const priceB = BigInt(b.priceQ96)
      if (priceA < priceB) {
        return -1
      }
      if (priceA > priceB) {
        return 1
      }
      return 0
    })
    setTickDetails(sorted)
  }, [data, isEnabled, setTickDetails])
}
