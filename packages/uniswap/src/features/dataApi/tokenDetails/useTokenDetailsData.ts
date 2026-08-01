/**
 * Shared hooks for token detail data across mobile and web
 *
 * Data source preference (FeatureFlags.V2EndpointsTokens off):
 * - CoinGecko (TokenProjectMarket) first for: price, marketCap, FDV, 52w high/low, 24hr price change
 * - CoinGecko (TokenProjectMarket) first for volume when preferProjectMarketData is true
 * - Subgraph (TokenMarket) fallback/default for volume
 *
 * When FeatureFlags.V2EndpointsTokens is on, GraphQL is not read at all - REST-unavailable
 * fields (marketCap/fdv) resolve to undefined rather than falling back to GraphQL, except when
 * preferProjectMarketData is true, which always sources from GraphQL.
 */

import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type {
  GetTokenMarketsMultiChainResponse,
  GetTokenMarketsResponse,
  GetTokenResponse,
  GetTokensMultiChainResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  HistoryDuration,
  type TokenMarketStats as RestTokenMarketStats,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import {
  getGetTokenMarketsMultiChainQueryOptions,
  getGetTokenMarketsQueryOptions,
  getGetTokenQueryOptions,
  getGetTokensMultiChainQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import {
  useTokenMarketPartsFragment,
  useTokenProjectMarketsPartsFragment,
} from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import {
  adaptLegacyMarketData,
  adaptLegacyProjectMarketData,
} from 'uniswap/src/features/dataApi/tokenDetails/legacyMarketDataAdapters'
import {
  adaptLegacyTokenMetadata,
  type LegacyTokenMetadataInput,
} from 'uniswap/src/features/dataApi/tokenDetails/legacyMetadataAdapters'
import type { MarketStatsData, TokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import { computeTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import type { TokenMetadataData } from 'uniswap/src/features/dataApi/tokenDetails/tokenMetadataUtils'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import type { CurrencyId } from 'uniswap/src/types/currency'

export type { TokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
export type { TokenMetadataData } from 'uniswap/src/features/dataApi/tokenDetails/tokenMetadataUtils'

/**
 * Returns the current spot price for a token
 *
 * IMPORTANT: For multi-chain tokens (e.g., USDC on Ethereum vs Polygon), this returns
 * the per-chain price, NOT the aggregated project price. This ensures each chain's
 * token page shows the correct price for that specific chain.
 *
 * Prefers per-chain subgraph data by default, falls back to aggregated CoinGecko data.
 * Callers can prefer project market data when the aggregated quote is the intended display value.
 *
 * When `isMultichainAggregateView` is true (the all-networks view of a genuinely multichain asset),
 * fetches via GetTokensMultiChain instead — its price is sourced from a fixed canonical chain
 * instance rather than the caller's per-chain currencyId.
 */
export interface UseTokenSpotPriceOptions {
  preferProjectMarketData?: boolean
  /** True for the "all networks" aggregate view of a genuinely multichain asset. When true, V2 fetches spot price via GetTokensMultiChain instead of the single-chain GetToken. */
  isMultichainAggregateView?: boolean
}

function selectSpotUsd(data: PlainMessage<GetTokenResponse> | undefined): number | undefined {
  return data?.token?.price?.spotUsd
}

function selectMultichainSpotUsd(data: PlainMessage<GetTokensMultiChainResponse> | undefined): number | undefined {
  return data?.tokens[0]?.price?.spotUsd
}

function selectPercentChange1d(data: PlainMessage<GetTokenResponse> | undefined): number | undefined {
  return data?.token?.price?.percentChange1d
}

export function useTokenSpotPrice(
  currencyId: CurrencyId | undefined,
  options?: UseTokenSpotPriceOptions,
): number | undefined {
  const id = currencyId ?? ''
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const preferProjectMarketData = options?.preferProjectMarketData ?? false
  const shouldUseV2Tokens = isV2TokensEnabled && !preferProjectMarketData
  const tokenMarket = useTokenMarketPartsFragment({ currencyId: id, preferProjectMarketData }).data.market
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId: id, preferProjectMarketData }).data.project
    ?.markets
  const isMultichainAggregation = options?.isMultichainAggregateView ?? false

  const restTokenIdentifier = useMemo(
    () => (currencyId ? currencyIdToRestContractInput(currencyId) : undefined),
    [currencyId],
  )
  const { data: singleChainRestSpotUsd } = useQuery(
    getGetTokenQueryOptions({
      params: restTokenIdentifier,
      enabled: shouldUseV2Tokens && !isMultichainAggregation && !!restTokenIdentifier,
      select: selectSpotUsd,
    }),
  )
  const { data: multichainRestSpotUsd } = useQuery(
    getGetTokensMultiChainQueryOptions({
      params: restTokenIdentifier
        ? { identifier: { case: 'tokens', value: { tokens: [restTokenIdentifier] } } }
        : undefined,
      enabled: shouldUseV2Tokens && isMultichainAggregation && !!restTokenIdentifier,
      select: selectMultichainSpotUsd,
    }),
  )
  const restSpotUsd = isMultichainAggregation ? multichainRestSpotUsd : singleChainRestSpotUsd

  const legacyMarketPrice = tokenMarket?.price?.value
  const legacyProjectMarketPrice = projectMarkets?.[0]?.price?.value

  return useMemo(() => {
    if (preferProjectMarketData) {
      return legacyProjectMarketPrice ?? legacyMarketPrice
    }
    if (isV2TokensEnabled) {
      return restSpotUsd
    }
    return legacyMarketPrice ?? legacyProjectMarketPrice
  }, [preferProjectMarketData, isV2TokensEnabled, restSpotUsd, legacyMarketPrice, legacyProjectMarketPrice])
}

export interface ResolveSpotPriceOverrideParams {
  isV2TokensEnabled: boolean
  /** True only for a genuinely multichain asset with no specific chain selected (the "all networks" view). */
  isMultichainAggregateView: boolean
  preferProjectMarketData: boolean
  spotPrice: number | undefined
}

/**
 * Decides whether `useTokenSpotPrice`'s value should be used as a display override, or discarded
 * so the caller falls back to its own aggregate price source.
 *
 * Once V2 is enabled, `useTokenSpotPrice`'s value is always authoritative, even on the
 * all-networks view — pass `isMultichainAggregateView` there to get GetTokensMultiChain's
 * canonical-chain price instead of an arbitrary per-chain one. Legacy GraphQL still defers to the
 * caller's project-level aggregate there (unless RWA/project-market-preferred), since the
 * per-chain subgraph price would misrepresent the aggregate.
 *
 * Shared by the TDP chart header and stats section so they can't drift on this decision.
 */
export function resolveSpotPriceOverride({
  isV2TokensEnabled,
  isMultichainAggregateView,
  preferProjectMarketData,
  spotPrice,
}: ResolveSpotPriceOverrideParams): number | undefined {
  if (isV2TokensEnabled) {
    return spotPrice
  }
  return isMultichainAggregateView && !preferProjectMarketData ? undefined : spotPrice
}

export interface UseTokenPriceChangeOptions {
  preferProjectMarketData?: boolean
}

/**
 * Returns the 24hr price change percentage for a token
 */
export function useTokenPriceChange(currencyId: CurrencyId, options?: UseTokenPriceChangeOptions): number | undefined {
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const preferProjectMarketData = options?.preferProjectMarketData ?? false
  const projectMarkets = useTokenProjectMarketsPartsFragment({ currencyId, preferProjectMarketData }).data.project
    ?.markets

  const restTokenIdentifier = useMemo(() => currencyIdToRestContractInput(currencyId), [currencyId])
  const { data: restPercentChange1d } = useQuery(
    getGetTokenQueryOptions({
      params: restTokenIdentifier,
      enabled: isV2TokensEnabled && !preferProjectMarketData,
      select: selectPercentChange1d,
    }),
  )

  const legacyPercentChange24h = projectMarkets?.[0]?.pricePercentChange24h?.value

  return useMemo(() => {
    if (preferProjectMarketData) {
      return legacyPercentChange24h
    }
    if (isV2TokensEnabled) {
      return restPercentChange1d
    }
    return legacyPercentChange24h
  }, [preferProjectMarketData, isV2TokensEnabled, restPercentChange1d, legacyPercentChange24h])
}

/** Optional aggregated market + project data (e.g. from TDP TokenWebQuery when multichain). When provided, stats are computed from this instead of fragment/REST queries. */
export interface TokenMarketStatsAggregatedInput {
  market?: MarketStatsData
  projectMarket?: MarketStatsData
}

export interface UseTokenMarketStatsParams {
  currentPriceOverride?: number
  aggregatedData?: TokenMarketStatsAggregatedInput | null
  preferProjectMarketData?: boolean
  isMultichainAggregateView?: boolean
}

function mapRestTokenMarketStats(stats: PlainMessage<RestTokenMarketStats> | undefined): MarketStatsData | undefined {
  if (!stats) {
    return undefined
  }
  return {
    volumeUsd: stats.volumeUsd,
    priceHigh52wUsd: stats.priceHigh52wUsd,
    priceLow52wUsd: stats.priceLow52wUsd,
    marketCapUsd: stats.marketCapUsd,
    fullyDilutedValuationUsd: stats.fullyDilutedValuationUsd,
    totalValueLockedUsd: stats.totalValueLockedUsd,
  }
}

function selectMarketStatsData(data: PlainMessage<GetTokenMarketsResponse> | undefined): MarketStatsData | undefined {
  return mapRestTokenMarketStats(data?.markets[0]?.stats)
}

// Querying by a single known deployment returns one aggregated market.
function selectMultichainMarketStatsData(
  data: PlainMessage<GetTokenMarketsMultiChainResponse> | undefined,
): MarketStatsData | undefined {
  return mapRestTokenMarketStats(data?.markets[0]?.stats)
}

export function useTokenMarketStats(currencyId: CurrencyId, params?: UseTokenMarketStatsParams): TokenMarketStats {
  const { currentPriceOverride, aggregatedData, preferProjectMarketData, isMultichainAggregateView } = params ?? {}
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const isMultichainAggregation = isMultichainAggregateView ?? false
  const shouldUseV2Tokens = isV2TokensEnabled && !preferProjectMarketData

  // Legacy path: GraphQL fragments read from the TokenWeb query cache. These hooks gate themselves off
  // internally once V2 is enabled (see useTokenMarketPartsFragment/useTokenProjectMarketsPartsFragment).
  const legacyTokenMarket = useTokenMarketPartsFragment({ currencyId, preferProjectMarketData }).data.market
  const legacyProjectMarkets = useTokenProjectMarketsPartsFragment({ currencyId, preferProjectMarketData }).data.project
    ?.markets

  // V2 path: on-chain market stats (TVL/volume/52w) from GetTokenMarkets, or from
  // GetTokenMarketsMultiChain (summed across chains) when showing the all-networks aggregate.
  const restTokenIdentifier = useMemo(() => currencyIdToRestContractInput(currencyId), [currencyId])
  const { data: singleChainRestMarket } = useQuery(
    getGetTokenMarketsQueryOptions({
      params: isMultichainAggregation ? undefined : { tokens: [restTokenIdentifier], duration: HistoryDuration.DAY },
      enabled: shouldUseV2Tokens,
      select: selectMarketStatsData,
    }),
  )
  const { data: multichainRestMarket } = useQuery(
    getGetTokenMarketsMultiChainQueryOptions({
      params: {
        identifier: { case: 'tokens', value: { tokens: [restTokenIdentifier] } },
        duration: HistoryDuration.DAY,
      },
      enabled: shouldUseV2Tokens && isMultichainAggregation,
      select: selectMultichainMarketStatsData,
    }),
  )
  const restMarket = isMultichainAggregation ? multichainRestMarket : singleChainRestMarket

  return useMemo(() => {
    const market = shouldUseV2Tokens ? restMarket : adaptLegacyMarketData(legacyTokenMarket)
    const projectMarket = shouldUseV2Tokens ? undefined : adaptLegacyProjectMarketData(legacyProjectMarkets?.[0])

    // When V2 is enabled, REST is the sole source of truth: never shadow a missing/empty REST
    // response with GraphQL-sourced aggregated data.
    const hasAggregated =
      !shouldUseV2Tokens &&
      aggregatedData &&
      (aggregatedData.market?.volumeUsd != null ||
        aggregatedData.market?.priceHigh52wUsd != null ||
        aggregatedData.projectMarket != null)
    if (hasAggregated) {
      return computeTokenMarketStats({
        market: aggregatedData.market,
        projectMarket: aggregatedData.projectMarket,
        currentPrice: currentPriceOverride,
        preferProjectMarketData,
      })
    }
    return computeTokenMarketStats({
      market,
      projectMarket,
      currentPrice: currentPriceOverride,
      preferProjectMarketData,
    })
  }, [
    aggregatedData,
    currentPriceOverride,
    preferProjectMarketData,
    shouldUseV2Tokens,
    restMarket,
    legacyTokenMarket,
    legacyProjectMarkets,
  ])
}

function selectTokenMetadata(data: PlainMessage<GetTokenResponse> | undefined): TokenMetadataData | undefined {
  const token = data?.token
  if (!token) {
    return undefined
  }
  return {
    name: token.name,
    symbol: token.symbol,
    logoUrl: token.project?.logoUrl,
    description: token.project?.description,
    homepageUrl: token.project?.homepageUrl,
    twitterName: token.project?.twitterName,
    isSpam: token.safety?.isSpam,
  }
}

export interface UseTokenMetadataParams {
  /** Raw legacy GraphQL token data already fetched by the caller (e.g. tokenProjectQuery.data?.token); adapted internally. */
  legacyToken?: LegacyTokenMetadataInput
}

/**
 * Returns display metadata (name/symbol/logo/description/homepage/twitter/spam) for a token.
 *
 * Legacy path: callers pass their already-fetched raw GraphQL token data since the web TDP
 * already holds it in its zustand store — no new Apollo fragment read is needed.
 *
 * V2 path: sourced from the same REST GetToken response used by useTokenSpotPrice, so no
 * additional network request is introduced.
 */
export function useTokenMetadata(
  currencyId: CurrencyId | undefined,
  params?: UseTokenMetadataParams,
): TokenMetadataData {
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const restTokenIdentifier = useMemo(
    () => (currencyId ? currencyIdToRestContractInput(currencyId) : undefined),
    [currencyId],
  )
  const { data: restMetadata } = useQuery(
    getGetTokenQueryOptions({
      params: restTokenIdentifier,
      enabled: isV2TokensEnabled && !!restTokenIdentifier,
      select: selectTokenMetadata,
    }),
  )
  const legacyMetadata = useMemo(() => adaptLegacyTokenMetadata(params?.legacyToken), [params?.legacyToken])

  return useMemo(() => {
    if (isV2TokensEnabled) {
      return restMetadata ?? {}
    }
    return legacyMetadata ?? {}
  }, [isV2TokensEnabled, restMetadata, legacyMetadata])
}
