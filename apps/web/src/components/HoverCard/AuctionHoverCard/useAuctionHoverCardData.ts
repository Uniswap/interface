import { toPlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import { GetAuctionRequest, GetLatestCheckpointRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { AddressStringFormat, normalizeAddress, type UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import {
  AUCTION_DEFAULT_RETRY,
  AuctionStaleTime,
  auctionQueryKeys,
} from 'uniswap/src/data/apiClients/dataApiService/auctions/queryTypes'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { PriceChartType } from '~/components/Charts/utils'
import { useTokenPriceChartData } from '~/hooks/useTokenPriceChartData'

// Loaded on demand: the navbar search imports this card, so a static import would pull the connect
// client and transport onto every page.
async function getAuctionServiceClient(): Promise<
  typeof import('uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient').AuctionServiceClient
> {
  const { AuctionServiceClient } =
    await import('uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient')
  return AuctionServiceClient
}

export function parseUsd(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export interface AuctionHoverCardData {
  fdvUsd: number | undefined
  /** Supply is fixed, so the day's price change is also the FDV change. */
  pricePercentChange: number | undefined
  priceData: PriceChartData[]
  committedVolumeUsd: number | undefined
  bidCount: number | undefined
  loading: boolean
}

/** Query keys and staleness are the auction page's own, so the cache entry is shared with it. */
export function useAuctionHoverCardData({
  chainId,
  auctionAddress,
  tokenAddress,
  enabled,
  fetchBidCount,
}: {
  chainId: UniverseChainId
  auctionAddress: string
  tokenAddress: string
  enabled: boolean
  fetchBidCount: boolean
}): AuctionHoverCardData {
  // Lowercased to match the auction page's own GetAuction params, so the cache entry is shared.
  const address = normalizeAddress(auctionAddress, AddressStringFormat.Lowercase)
  // Search rows fall back to '' when neither the auction address nor its id is routeable; nothing to fetch then.
  const isEnabled = enabled && auctionAddress.length > 0
  // A skipped query stays `isPending` forever, so only an enabled chart may hold `loading` open.
  const chartEnabled = isEnabled && tokenAddress.length > 0
  const auctionRequest = useMemo(() => new GetAuctionRequest({ chainId, address }), [chainId, address])
  const checkpointRequest = useMemo(() => new GetLatestCheckpointRequest({ chainId, address }), [chainId, address])

  const { data: auctionResponse, isLoading: auctionLoading } = useQuery({
    queryKey: auctionQueryKeys.getAuction(auctionRequest),
    queryFn: async () => toPlainMessage(await (await getAuctionServiceClient()).getAuction(auctionRequest)),
    enabled: isEnabled,
    staleTime: AuctionStaleTime.FAST,
    retry: AUCTION_DEFAULT_RETRY,
    meta: { persist: true },
  })

  const { data: checkpointResponse, isLoading: checkpointLoading } = useQuery({
    queryKey: auctionQueryKeys.getLatestCheckpoint(checkpointRequest),
    queryFn: async () => toPlainMessage(await (await getAuctionServiceClient()).getLatestCheckpoint(checkpointRequest)),
    enabled: isEnabled && fetchBidCount,
    staleTime: AuctionStaleTime.REALTIME,
    retry: AUCTION_DEFAULT_RETRY,
    meta: { persist: true },
  })

  const chartVariables = useMemo(
    () => ({
      chain: toGraphQLChain(chainId),
      address: tokenAddress,
      duration: HistoryDuration.Day,
      multichain: false,
    }),
    [chainId, tokenAddress],
  )
  const { entries: priceData, loading: chartLoading } = useTokenPriceChartData({
    variables: chartVariables,
    skip: !chartEnabled,
    priceChartType: PriceChartType.LINE,
  })

  const pricePercentChange = useMemo(
    () => getPortfolioChartPercentChange(priceData.map((entry) => entry.value))?.percentChange,
    [priceData],
  )

  const auction = auctionResponse?.auctions[0]

  return {
    fdvUsd: parseUsd(auction?.fdvUsd),
    pricePercentChange,
    priceData,
    committedVolumeUsd: parseUsd(auction?.totalBidVolumeUsd),
    bidCount: checkpointResponse?.totalBidCount,
    // The checkpoint is the only source of `bidCount`, so the stats row waits for it too or participation pops in late.
    loading: isEnabled && (auctionLoading || (chartEnabled && chartLoading) || (fetchBidCount && checkpointLoading)),
  }
}
