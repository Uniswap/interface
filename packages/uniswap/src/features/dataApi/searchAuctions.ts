import { toPlainMessage, type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import {
  ListTopAuctionsRequest,
  type AuctionWithStats,
  type ListTopAuctionsResponse,
} from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import type { SearchAuction } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { type UniverseChainId, Platform } from '@universe/chains'
import { DynamicConfigs, useDynamicConfigValue, VerifiedAuctionsConfigKey } from '@universe/gating'
import { useMemo } from 'react'
import { type AuctionOption, OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { fetchAuctionByAddress } from 'uniswap/src/data/apiClients/dataApiService/search/search'
import { timestampToMs } from 'uniswap/src/data/apiClients/dataApiService/utils/protoTimestamp'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import type { AuctionSearchStats, CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NUMBER_OF_RESULTS_LONG } from 'uniswap/src/features/search/SearchModal/constants'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  DEFAULT_VERIFIED_AUCTION_IDS,
  findAuctionOverrideMatches,
  getAuctionMetadata,
} from 'uniswap/src/features/toucan/auctionMetadata'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { parseFiniteNumber } from 'utilities/src/primitives/number'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

/** Plain data.v2 auction shape, the canonical type for search auction results. */
export type SearchAuctionResult = PlainMessage<SearchAuction>

function lowercaseAscii(value: string): string {
  return value.replace(/[A-Z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 32))
}

function getValidEvmAddress(address: string | undefined): string | undefined {
  if (!address) {
    return undefined
  }

  const trimmedAddress = address.trim()
  const addressWithPrefix =
    trimmedAddress.startsWith('0x') || trimmedAddress.startsWith('0X') ? trimmedAddress : `0x${trimmedAddress}`

  return addressWithPrefix.length === 42 ? lowercaseAscii(addressWithPrefix) : undefined
}

function getAuctionAddressFromAuctionId(auctionId: string): string | undefined {
  const [chainId, auctionAddress, extraSegment] = auctionId.split('_')
  if (!chainId || !auctionAddress || extraSegment) {
    return undefined
  }

  return getValidEvmAddress(auctionAddress)
}

function getSearchAuctionAddress(auction: SearchAuctionResult): string {
  const auctionAddress = getValidEvmAddress(auction.auctionAddress)
  if (auctionAddress) {
    return auctionAddress
  }

  return getAuctionAddressFromAuctionId(auction.auctionId) ?? ''
}

function buildCurrencyInfoMap(
  currencyIds: string[],
  currencyInfos: Array<Maybe<CurrencyInfo>>,
): Map<string, CurrencyInfo> {
  const map = new Map<string, CurrencyInfo>()
  currencyIds.forEach((id, index) => {
    const info = currencyInfos[index]
    if (info) {
      map.set(id, info)
    }
  })
  return map
}

function toAuctionSearchStats({
  fdvUsd,
  estimatedEndTime,
}: Pick<SearchAuctionResult, 'fdvUsd' | 'estimatedEndTime'>): AuctionSearchStats | undefined {
  const stats = { fdvUsd: parseFiniteNumber(fdvUsd), endTimeMs: timestampToMs(estimatedEndTime) }
  return stats.fdvUsd === undefined && stats.endTimeMs === undefined ? undefined : stats
}

async function fetchOverrideMatchedAuctions(
  matches: Array<{ chainId: number; tokenAddress: string }>,
): Promise<SearchAuctionResult[]> {
  // allSettled so one failed match doesn't drop the rest (supplementary results, graceful degradation).
  const results = await Promise.allSettled(
    matches.map((match) => fetchAuctionByAddress({ chainId: match.chainId, address: match.tokenAddress })),
  )
  const auctions: SearchAuctionResult[] = []
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value !== undefined) {
      auctions.push(result.value)
    }
  }
  return auctions
}

function mergeAuctions(primary: SearchAuctionResult[], supplementary: SearchAuctionResult[]): SearchAuctionResult[] {
  const seen = new Set(primary.map((auction) => auction.auctionId))
  const merged = [...primary]
  for (const auction of supplementary) {
    if (!seen.has(auction.auctionId)) {
      seen.add(auction.auctionId)
      merged.push(auction)
    }
  }
  return merged
}

function getAuctionOptionTokenMetadata({
  chainId,
  tokenAddress,
  tokenName,
  tokenSymbol,
  currencyInfo,
}: {
  chainId: number
  tokenAddress: string
  tokenName: string | undefined
  tokenSymbol: string
  currencyInfo: Maybe<CurrencyInfo>
}): Pick<AuctionOption, 'tokenName' | 'tokenSymbol' | 'tokenLogoUrl'> {
  const metadataOverride = getAuctionMetadata({ chainId, tokenAddress })

  return {
    tokenName: metadataOverride?.tokenName || currencyInfo?.currency.name || tokenName || undefined,
    tokenSymbol: metadataOverride?.tokenSymbol || currencyInfo?.currency.symbol || tokenSymbol,
    tokenLogoUrl: metadataOverride?.logoUrl || currencyInfo?.logoUrl || undefined,
  }
}

export function searchAuctionToAuctionOption({
  auction,
  currencyInfo,
  isVerified,
}: {
  auction: SearchAuctionResult
  currencyInfo: Maybe<CurrencyInfo>
  isVerified: boolean
}): AuctionOption {
  const tokenMetadata = getAuctionOptionTokenMetadata({
    chainId: auction.chainId,
    tokenAddress: auction.tokenAddress,
    tokenName: auction.tokenName,
    tokenSymbol: auction.tokenSymbol,
    currencyInfo,
  })

  return {
    type: OnchainItemListOptionType.Auction,
    auctionId: auction.auctionId,
    auctionAddress: getSearchAuctionAddress(auction),
    chainId: auction.chainId as UniverseChainId,
    tokenAddress: auction.tokenAddress,
    ...tokenMetadata,
    currencyInfo,
    committedVolumeUsd: parseFiniteNumber(auction.totalBidVolumeUsd),
    isVerified,
    searchStats: toAuctionSearchStats(auction),
  }
}

export function auctionWithStatsToAuctionOption({
  auctionWithStats,
  currencyInfo,
  isVerified,
}: {
  auctionWithStats: AuctionWithStats | PlainMessage<AuctionWithStats>
  currencyInfo: Maybe<CurrencyInfo>
  isVerified: boolean
}): AuctionOption | undefined {
  const auction = auctionWithStats.auction
  if (!auction) {
    return undefined
  }

  const tokenMetadata = getAuctionOptionTokenMetadata({
    chainId: auction.chainId,
    tokenAddress: auction.tokenAddress,
    tokenName: auction.tokenName,
    tokenSymbol: auction.tokenSymbol,
    currencyInfo,
  })

  return {
    type: OnchainItemListOptionType.Auction,
    auctionId: auction.auctionId,
    auctionAddress: auction.address,
    chainId: auction.chainId as UniverseChainId,
    tokenAddress: auction.tokenAddress,
    ...tokenMetadata,
    currencyInfo,
    committedVolumeUsd: parseFiniteNumber(auction.totalBidVolumeUsd),
    uniqueBidderCount: auctionWithStats.uniqueBidderCount,
    isVerified,
    searchStats: toAuctionSearchStats(auction),
  }
}

/**
 * Turns the auction bucket of a search response into row options: merges in the curated override
 * auctions the query names, drops testnet rows outside testnet mode, and enriches with CurrencyInfo
 * and the verified-auction config. The search request itself is made by `useSearchResults`.
 */
export function useSearchAuctionOptions({
  auctions,
  searchQuery,
  chainFilter,
  skip,
}: {
  auctions: SearchAuctionResult[] | undefined
  searchQuery: string | null
  chainFilter: UniverseChainId | null
  skip: boolean
}): { data: AuctionOption[]; refetch: () => Promise<unknown> } {
  const { chains: enabledChainIds, isTestnetModeEnabled } = useEnabledChains({ platform: Platform.EVM })

  const verifiedAuctionIds: string[] = useDynamicConfigValue({
    config: DynamicConfigs.VerifiedAuctions,
    key: VerifiedAuctionsConfigKey.VerifiedAuctionIds,
    defaultValue: DEFAULT_VERIFIED_AUCTION_IDS,
  })

  // Restrict curated override matches to the active chain set so a chain-filtered search
  // doesn't surface an override auction from a chain the user filtered out.
  const overrideMatches = useMemo(() => {
    if (!searchQuery) {
      return []
    }
    const allowedChainIds = new Set<number>(chainFilter ? [chainFilter] : enabledChainIds)
    return findAuctionOverrideMatches(searchQuery).filter((match) => allowedChainIds.has(match.chainId))
  }, [searchQuery, chainFilter, enabledChainIds])

  const { data: overrideAuctions, refetch } = useQuery<SearchAuctionResult[]>({
    queryKey: [ReactQueryCacheKey.DataApiService, 'auctionOverrideMatches', overrideMatches],
    queryFn: () => fetchOverrideMatchedAuctions(overrideMatches),
    enabled: !skip && Boolean(searchQuery) && overrideMatches.length > 0,
  })

  const filteredAuctions = useMemo(() => {
    if (skip) {
      return []
    }
    return mergeAuctions(auctions ?? [], overrideAuctions ?? []).filter(
      (auction) => isTestnetModeEnabled || !isTestnetChain(auction.chainId),
    )
  }, [skip, auctions, overrideAuctions, isTestnetModeEnabled])

  // Enrich with currencyInfos for logos and safety info
  const currencyIds = useMemo(
    () => filteredAuctions.map((auction) => buildCurrencyId(auction.chainId, auction.tokenAddress)),
    [filteredAuctions],
  )

  const currencyInfos = useCurrencyInfos(currencyIds, {
    skip: !filteredAuctions.length,
  })

  const currencyInfoMap = useMemo(() => buildCurrencyInfoMap(currencyIds, currencyInfos), [currencyIds, currencyInfos])

  const auctionOptions = useMemo<AuctionOption[]>(() => {
    if (!filteredAuctions.length) {
      return []
    }

    const verifiedSet = new Set(verifiedAuctionIds)

    return filteredAuctions.map((auction) => {
      const cId = buildCurrencyId(auction.chainId, auction.tokenAddress)
      return searchAuctionToAuctionOption({
        auction,
        currencyInfo: currencyInfoMap.get(cId) ?? null,
        isVerified: verifiedSet.has(auction.auctionId),
      })
    })
  }, [filteredAuctions, currencyInfoMap, verifiedAuctionIds])

  return useMemo(() => ({ data: auctionOptions, refetch }), [auctionOptions, refetch])
}

export function useTopAuctionOptions({
  chainFilter,
  skip,
  size = NUMBER_OF_RESULTS_LONG,
}: {
  chainFilter: UniverseChainId | null
  skip: boolean
  size?: number
}): DerivedQueryResult<AuctionOption[]> {
  const { isTestnetModeEnabled } = useEnabledChains()

  const verifiedAuctionIds: string[] = useDynamicConfigValue({
    config: DynamicConfigs.VerifiedAuctions,
    key: VerifiedAuctionsConfigKey.VerifiedAuctionIds,
    defaultValue: DEFAULT_VERIFIED_AUCTION_IDS,
  })

  const params = useMemo(
    () =>
      new ListTopAuctionsRequest({
        pageSize: size,
        chainIds: chainFilter ? [chainFilter] : [],
      }),
    [chainFilter, size],
  )

  const {
    data: topAuctions,
    error,
    isLoading,
    refetch,
  } = useQuery<PlainMessage<ListTopAuctionsResponse>, Error>({
    queryKey: [ReactQueryCacheKey.AuctionApi, 'listTopAuctions', params],
    queryFn: async () => {
      const { AuctionServiceClient } =
        await import('uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient')
      return toPlainMessage(await AuctionServiceClient.listTopAuctions(params))
    },
    enabled: !skip,
    meta: { persist: true },
  })

  const auctions = useMemo(
    () =>
      topAuctions?.auctions.filter((auctionWithStats) => {
        const chainId = auctionWithStats.auction?.chainId
        return chainId !== undefined && (isTestnetModeEnabled || !isTestnetChain(chainId))
      }) ?? [],
    [topAuctions?.auctions, isTestnetModeEnabled],
  )

  const currencyIds = useMemo(
    () =>
      auctions
        .map((auctionWithStats) => {
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
      .map((auctionWithStats) => {
        const auction = auctionWithStats.auction
        const currencyId = auction ? buildCurrencyId(auction.chainId, auction.tokenAddress) : undefined

        return auctionWithStatsToAuctionOption({
          auctionWithStats,
          currencyInfo: currencyId ? (currencyInfoMap.get(currencyId) ?? null) : null,
          isVerified: auction ? verifiedSet.has(auction.auctionId) : false,
        })
      })
      .filter((option): option is AuctionOption => option !== undefined)
  }, [auctions, currencyInfoMap, verifiedAuctionIds])

  return useMemo(
    () => ({ data: auctionOptions, isLoading, error, refetch }),
    [auctionOptions, isLoading, error, refetch],
  )
}
