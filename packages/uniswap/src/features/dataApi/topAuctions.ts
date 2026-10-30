import { toPlainMessage, type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import {
  AuctionStatusFilter,
  ListTopAuctionsRequest,
  type AuctionWithStats,
  type ListTopAuctionsResponse,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { type UniverseChainId, Platform } from '@universe/chains'
import { useCallback, useMemo } from 'react'
import type { AuctionOption } from 'uniswap/src/components/lists/items/types'
import {
  auctionQueryKeys,
  loadAuctionServiceClient,
} from 'uniswap/src/data/apiClients/dataApiService/auctions/queryTypes'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { auctionWithStatsToAuctionOption, buildCurrencyInfoMap } from 'uniswap/src/features/dataApi/searchAuctions'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { isHiddenAuction } from 'uniswap/src/features/toucan/hiddenAuctions'
import { useVerifiedAuctionIds } from 'uniswap/src/features/toucan/useVerifiedAuctionIds'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { parseFiniteNumber } from 'utilities/src/primitives/number'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

// Oversized: the BE pads small ACTIVE pages with its newest launches instead of top volume.
const TOP_AUCTIONS_PAGE_SIZE = 15
const ACTIVE_AUCTION_MIN_VOLUME_USD = 1_000
const COMPLETED_AUCTION_MIN_VOLUME_USD = 10_000

/** Visible auctions with at least `minVolumeUsd` committed, highest committed volume first. */
function rankQualifyingAuctions({
  response,
  minVolumeUsd,
}: {
  response: PlainMessage<ListTopAuctionsResponse> | undefined
  minVolumeUsd: number
}): PlainMessage<AuctionWithStats>[] {
  return (response?.auctions ?? [])
    .filter(({ auction }) => !isHiddenAuction({ auctionId: auction?.auctionId }))
    .map((auctionWithStats) => ({
      auctionWithStats,
      volumeUsd: parseFiniteNumber(auctionWithStats.auction?.totalBidVolumeUsd) ?? 0,
    }))
    .filter(({ volumeUsd }) => volumeUsd >= minVolumeUsd)
    .sort((a, b) => b.volumeUsd - a.volumeUsd)
    .map(({ auctionWithStats }) => auctionWithStats)
}

async function listTopAuctions(params: ListTopAuctionsRequest): Promise<PlainMessage<ListTopAuctionsResponse>> {
  return toPlainMessage(await (await loadAuctionServiceClient()).listTopAuctions(params))
}

/** Active auctions by committed volume, then completed ones, capped at `size`. */
export function useTopAuctionOptions({
  chainFilter,
  size,
  skip,
}: {
  chainFilter: UniverseChainId | null
  size: number
  skip: boolean
}): DerivedQueryResult<AuctionOption[]> {
  const { chains: enabledChainIds } = useEnabledChains({ platform: Platform.EVM })

  const verifiedAuctionIds = useVerifiedAuctionIds()

  const { activeParams, completedParams } = useMemo(() => {
    const chainIds = chainFilter ? [chainFilter] : enabledChainIds
    return {
      activeParams: new ListTopAuctionsRequest({
        pageSize: TOP_AUCTIONS_PAGE_SIZE,
        chainIds,
        statusFilter: AuctionStatusFilter.ACTIVE,
      }),
      completedParams: new ListTopAuctionsRequest({
        pageSize: TOP_AUCTIONS_PAGE_SIZE,
        chainIds,
        statusFilter: AuctionStatusFilter.COMPLETED,
      }),
    }
  }, [chainFilter, enabledChainIds])

  const activeQuery = useQuery<PlainMessage<ListTopAuctionsResponse>, Error>({
    queryKey: auctionQueryKeys.listTopAuctions(activeParams),
    queryFn: () => listTopAuctions(activeParams),
    enabled: !skip,
    meta: { persist: true },
  })
  const completedQuery = useQuery<PlainMessage<ListTopAuctionsResponse>, Error>({
    queryKey: auctionQueryKeys.listTopAuctions(completedParams),
    queryFn: () => listTopAuctions(completedParams),
    enabled: !skip,
    meta: { persist: true },
  })
  const { refetch: refetchActive } = activeQuery
  const { refetch: refetchCompleted } = completedQuery
  const refetch = useCallback(() => {
    void refetchActive()
    void refetchCompleted()
  }, [refetchActive, refetchCompleted])

  const auctions = useMemo(() => {
    // A persisted ACTIVE page can still list an auction that has since moved to COMPLETED.
    const completedIds = new Set(completedQuery.data?.auctions.map(({ auction }) => auction?.auctionId))
    const active = rankQualifyingAuctions({
      response: activeQuery.data,
      minVolumeUsd: ACTIVE_AUCTION_MIN_VOLUME_USD,
    }).filter(({ auction }) => !completedIds.has(auction?.auctionId))
    const completed = rankQualifyingAuctions({
      response: completedQuery.data,
      minVolumeUsd: COMPLETED_AUCTION_MIN_VOLUME_USD,
    })
    return [
      ...active.map((auctionWithStats) => ({ auctionWithStats, isEnded: false })),
      ...completed.map((auctionWithStats) => ({ auctionWithStats, isEnded: true })),
    ].slice(0, size)
  }, [activeQuery.data, completedQuery.data, size])

  const currencyIds = useMemo(
    () =>
      auctions
        .map(({ auctionWithStats }) => {
          const auction = auctionWithStats.auction
          return auction ? buildCurrencyId(auction.chainId, auction.tokenAddress) : undefined
        })
        .filter((currencyId): currencyId is string => currencyId !== undefined),
    [auctions],
  )

  const currencyInfos = useCurrencyInfos(currencyIds, {
    skip: auctions.length === 0,
  })

  const currencyInfoMap = useMemo(() => buildCurrencyInfoMap(currencyIds, currencyInfos), [currencyIds, currencyInfos])

  const auctionOptions = useMemo<AuctionOption[]>(() => {
    const verifiedSet = new Set(verifiedAuctionIds)

    return auctions
      .map(({ auctionWithStats, isEnded }) => {
        const auction = auctionWithStats.auction
        const currencyId = auction ? buildCurrencyId(auction.chainId, auction.tokenAddress) : undefined

        return auctionWithStatsToAuctionOption({
          auctionWithStats,
          currencyInfo: currencyId ? (currencyInfoMap.get(currencyId) ?? null) : null,
          isVerified: auction ? verifiedSet.has(auction.auctionId) : false,
          isEnded,
        })
      })
      .filter((option): option is AuctionOption => option !== undefined)
  }, [auctions, currencyInfoMap, verifiedAuctionIds])

  const isLoading = activeQuery.isLoading || completedQuery.isLoading
  const error = auctionOptions.length ? null : (activeQuery.error ?? completedQuery.error)
  return useMemo(
    () => ({ data: auctionOptions, isLoading, error, refetch }),
    [auctionOptions, isLoading, error, refetch],
  )
}
