import { useQuery } from '@tanstack/react-query'
import { GetBidsRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { useEffect, useMemo, useRef } from 'react'
import { auctionQueries } from 'uniswap/src/data/rest/auctions/auctionQueries'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { MAX_RENDERABLE_BARS } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import { AuctionProgressState, BidDistributionData } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore, useAuctionStoreActions } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

/**
 * Compares two BidDistributionData Maps for content equality.
 * Returns true if both maps have the same keys and values.
 */
function areBidMapsEqual(a: BidDistributionData | undefined, b: BidDistributionData | undefined): boolean {
  if (a === b) {
    return true
  }
  if (!a || !b) {
    return false
  }
  if (a.size !== b.size) {
    return false
  }
  for (const [key, value] of a) {
    if (b.get(key) !== value) {
      return false
    }
  }
  return true
}

function capConcentrationData({
  concentration,
  floorPriceQ96,
  tickSizeQ96,
}: {
  concentration: Record<string, { volume: string }> | undefined
  floorPriceQ96: string | undefined
  tickSizeQ96: string | undefined
}): { cappedConcentration: Record<string, { volume: string }>; capped: boolean; excludedVolume: bigint } {
  if (!concentration || !floorPriceQ96 || !tickSizeQ96) {
    return { cappedConcentration: concentration ?? {}, capped: false, excludedVolume: 0n }
  }

  try {
    const floor = BigInt(floorPriceQ96)
    const tickSize = BigInt(tickSizeQ96)
    if (tickSize <= 0n) {
      return { cappedConcentration: concentration, capped: false, excludedVolume: 0n }
    }

    const maxPriceQ96 = floor + tickSize * BigInt(MAX_RENDERABLE_BARS - 1)

    const filteredEntries: Array<[string, { volume: string }]> = []
    let excludedVolume = 0n
    for (const [priceQ96, value] of Object.entries(concentration)) {
      try {
        const price = BigInt(priceQ96)
        if (price <= maxPriceQ96) {
          filteredEntries.push([priceQ96, value])
        } else {
          excludedVolume += BigInt(value.volume)
        }
      } catch {
        // Ignore unparsable entries; they won't be rendered.
      }
    }

    const filtered = Object.fromEntries(filteredEntries) as Record<string, { volume: string }>
    const capped = filteredEntries.length !== Object.keys(concentration).length
    return { cappedConcentration: filtered, capped, excludedVolume }
  } catch {
    return { cappedConcentration: concentration, capped: false, excludedVolume: 0n }
  }
}

interface UseLoadBidDistributionDataParams {
  chainId: EVMUniverseChainId | undefined
  auctionAddress: string | undefined
}

/**
 * Hook to load bid distribution data from the GetBids API endpoint.
 * This hook is called at the provider level to share data between:
 * - AuctionStatsBanner (for concentration band display)
 * - BidDistributionChart (for rendering the distribution chart)
 *
 * The hook:
 * 1. Fetches bid data initially and polls while the auction is active
 * 2. Transforms API response into sorted BidDistributionData Map
 * 3. Updates the auction store with the data
 */
export function useLoadBidDistributionData({ chainId, auctionAddress }: UseLoadBidDistributionDataParams): void {
  const { setBidDistributionData } = useAuctionStoreActions()
  const { floorPrice, tickSize, isAuctionActive } = useAuctionStore((state) => ({
    floorPrice: state.auctionDetails?.floorPrice,
    tickSize: state.auctionDetails?.tickSize,
    isAuctionActive: state.progress.state === AuctionProgressState.IN_PROGRESS,
  }))

  const queryEnabled = Boolean(chainId && auctionAddress)

  // Determine polling interval based on chain type - only poll while auction is active
  const pollingInterval = useMemo(() => {
    if (!isAuctionActive || !chainId) {
      return false
    }
    return getPollingIntervalMs(chainId)
  }, [chainId, isAuctionActive])

  const { data, error: queryError } = useQuery(
    auctionQueries.getBids({
      params: new GetBidsRequest({
        chainId,
        address: auctionAddress,
      }),
      enabled: queryEnabled,
      refetchInterval: pollingInterval,
    }),
  )

  // Log any errors from the API
  if (queryError) {
    logger.warn('useLoadBidDistributionData', 'useGetBidsQuery', 'Failed to fetch bid distribution data', {
      chainId,
      auctionAddress,
      error: queryError.message,
    })
  }

  // Track previous bid map to avoid unnecessary reference changes
  const prevBidMapRef = useRef<BidDistributionData | undefined>(undefined)

  // Process the response and update store
  useEffect(() => {
    if (!data?.concentration) {
      // Clear store data when there's no data
      if (prevBidMapRef.current !== undefined) {
        setBidDistributionData(null)
        prevBidMapRef.current = undefined
      }
      return
    }

    const concentration = data.concentration
    const { cappedConcentration, excludedVolume } = capConcentrationData({
      concentration,
      floorPriceQ96: floorPrice,
      tickSizeQ96: tickSize,
    })

    // Sort prices numerically (ascending) before creating the map
    // This ensures the chart data is properly ordered
    const sortedPrices = Object.keys(cappedConcentration).sort((a, b) => {
      // Compare as BigInts to handle large Q96 values correctly
      const priceA = BigInt(a)
      const priceB = BigInt(b)
      if (priceA < priceB) {
        return -1
      }
      if (priceA > priceB) {
        return 1
      }
      return 0
    })

    // Build the bid distribution map
    const bidMap = new Map<string, string>()
    sortedPrices.forEach((price) => {
      const bidInfo = cappedConcentration[price]
      bidMap.set(price, bidInfo.volume)
    })

    // Only update if content has changed (avoid unnecessary re-renders)
    if (!areBidMapsEqual(prevBidMapRef.current, bidMap)) {
      prevBidMapRef.current = bidMap
      setBidDistributionData(bidMap, excludedVolume > 0n ? excludedVolume.toString() : null)
    }
  }, [data, setBidDistributionData, floorPrice, tickSize])
}
