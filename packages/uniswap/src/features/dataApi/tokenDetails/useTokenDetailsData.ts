import { type PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type {
  GetTokenMarketsMultiChainResponse,
  GetTokenMarketsResponse,
  GetTokenMultiChainResponse,
  GetTokenResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import {
  HistoryDuration,
  type TokenMarketStats as RestTokenMarketStats,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import {
  getGetTokenMarketsMultiChainQueryOptions,
  getGetTokenMarketsQueryOptions,
  getGetTokenMultiChainQueryOptions,
  getGetTokenQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { MarketStatsData, TokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import { computeTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import {
  normalizeTwitterHandle,
  type TokenMetadataData,
} from 'uniswap/src/features/dataApi/tokenDetails/tokenMetadataUtils'
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
 * fetches via GetTokenMultiChain instead — its price is sourced from a fixed canonical chain
 * instance rather than the caller's per-chain currencyId.
 */
export interface UseTokenSpotPriceOptions {
  /** True for the "all networks" aggregate view of a genuinely multichain asset. When true,fetches spot price via GetTokenMultiChain instead of the single-chain GetToken. */
  isMultichainAggregateView?: boolean
  refetchInterval?: number
  skip?: boolean
}

function selectSpotUsd(data: PlainMessage<GetTokenResponse> | undefined): number | undefined {
  return data?.token?.price?.spotUsd
}

function selectMultichainSpotUsd(data: PlainMessage<GetTokenMultiChainResponse> | undefined): number | undefined {
  return data?.token?.price?.spotUsd
}

function selectPercentChange1d(data: PlainMessage<GetTokenResponse> | undefined): number | undefined {
  return data?.token?.price?.percentChange1d
}

function selectMultichainPercentChange1d(
  data: PlainMessage<GetTokenMultiChainResponse> | undefined,
): number | undefined {
  return data?.token?.price?.percentChange1d
}

export function useTokenSpotPrice(
  currencyId: CurrencyId | undefined,
  options?: UseTokenSpotPriceOptions,
): number | undefined {
  const isMultichainAggregation = options?.isMultichainAggregateView ?? false

  const restTokenIdentifier = useMemo(
    () => (currencyId ? currencyIdToRestContractInput(currencyId) : undefined),
    [currencyId],
  )
  const { data: singleChainRestSpotUsd } = useQuery({
    ...getGetTokenQueryOptions({
      params: restTokenIdentifier,
      enabled: !options?.skip && !isMultichainAggregation && !!restTokenIdentifier,
      select: selectSpotUsd,
    }),
    refetchInterval: options?.refetchInterval,
  })
  const { data: multichainRestSpotUsd } = useQuery({
    ...getGetTokenMultiChainQueryOptions({
      params: restTokenIdentifier ? { identifier: { case: 'token', value: restTokenIdentifier } } : undefined,
      enabled: !options?.skip && isMultichainAggregation && !!restTokenIdentifier,
      select: selectMultichainSpotUsd,
    }),
    refetchInterval: options?.refetchInterval,
  })

  return useMemo(() => {
    return isMultichainAggregation ? multichainRestSpotUsd : singleChainRestSpotUsd
  }, [isMultichainAggregation, multichainRestSpotUsd, singleChainRestSpotUsd])
}

export interface UseTokenPriceChangeOptions {
  /** True for the "all networks" aggregate view of a genuinely multichain asset. When true, V2 fetches percent change via GetTokenMultiChain instead of the single-chain GetToken. */
  isMultichainAggregateView?: boolean
  /** Disables the V2 REST queries entirely, e.g. while the consuming surface is hidden */
  skip?: boolean
  /** Polls the V2 REST query at this cadence — without it the displayed change freezes, as REST token queries have no built-in polling. */
  refetchInterval?: number
}

/**
 * Returns the 24hr price change percentage for a token
 */
export function useTokenPriceChange(currencyId: CurrencyId, options?: UseTokenPriceChangeOptions): number | undefined {
  const isMultichainAggregation = options?.isMultichainAggregateView ?? false
  const enableQueries = !options?.skip

  const restTokenIdentifier = useMemo(() => currencyIdToRestContractInput(currencyId), [currencyId])
  const { data: singleChainPercentChange1d } = useQuery({
    ...getGetTokenQueryOptions({
      params: restTokenIdentifier,
      enabled: enableQueries && !isMultichainAggregation,
      select: selectPercentChange1d,
    }),
    refetchInterval: options?.refetchInterval,
  })
  const { data: multichainPercentChange1d } = useQuery({
    ...getGetTokenMultiChainQueryOptions({
      params: { identifier: { case: 'token', value: restTokenIdentifier } },
      enabled: enableQueries && isMultichainAggregation,
      select: selectMultichainPercentChange1d,
    }),
    refetchInterval: options?.refetchInterval,
  })

  return useMemo(() => {
    return isMultichainAggregation ? multichainPercentChange1d : singleChainPercentChange1d
  }, [isMultichainAggregation, multichainPercentChange1d, singleChainPercentChange1d])
}

export interface UseTokenMarketStatsParams {
  currentPriceOverride?: number
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

/**
 * Enabled chains for the GetTokenMarketsMultiChain `chainIds` filter, so the aggregated
 * volume/TVL only covers chains the user can see. Despite the proto comment claiming the
 * field is EVM-only, the prod backend recognizes Solana's chain id and includes its
 * volume/TVL (verified 2026-07: filter [1] vs [1, 501000101] returns different sums).
 * Ids the backend doesn't recognize are a 400; the query's fetch retries without `chainIds`
 * if that ever happens (see fetchTokenMarketsMultiChainWithChainIdFallback), degrading to the
 * unfiltered aggregate rather than blanking stats. In testnet mode the enabled set is testnets:
 * the backend recognizes today's testnet ids (verified 2026-07: [11155111] and [1301] return
 * 200) but zeroes the aggregate volume/TVL — so skip the filter entirely there.
 * Shared by useTokenMarketStats and the mobile TDP prefetch — both must build the same
 * params or the prefetch stops sharing a query cache entry with the read.
 */
export function useTokenMarketsEnabledChainIds(): UniverseChainId[] | undefined {
  const { chains, isTestnetModeEnabled } = useEnabledChains()
  return isTestnetModeEnabled ? undefined : chains
}

// Querying by a single known deployment returns one aggregated market.
function selectMultichainMarketStatsData(
  data: PlainMessage<GetTokenMarketsMultiChainResponse> | undefined,
): MarketStatsData | undefined {
  return mapRestTokenMarketStats(data?.markets[0]?.stats)
}

export interface UseTokenMarketStatsResult extends TokenMarketStats {
  isLoading: boolean
}

export function useTokenMarketStats(
  currencyId: CurrencyId,
  params?: UseTokenMarketStatsParams,
): UseTokenMarketStatsResult {
  const { currentPriceOverride, isMultichainAggregateView } = params ?? {}
  const isMultichainAggregation = isMultichainAggregateView ?? false

  // on-chain market stats (TVL/volume/52w) from GetTokenMarkets, or from
  // GetTokenMarketsMultiChain (summed across chains) when showing the all-networks aggregate.
  const restTokenIdentifier = useMemo(() => currencyIdToRestContractInput(currencyId), [currencyId])
  const { data: singleChainRestMarket, isLoading: isSingleChainMarketLoading } = useQuery(
    getGetTokenMarketsQueryOptions({
      params: isMultichainAggregation ? undefined : { tokens: [restTokenIdentifier], duration: HistoryDuration.DAY },
      select: selectMarketStatsData,
    }),
  )
  const marketsEnabledChainIds = useTokenMarketsEnabledChainIds()
  const { data: multichainRestMarket, isLoading: isMultichainMarketLoading } = useQuery(
    getGetTokenMarketsMultiChainQueryOptions({
      params: {
        identifier: { case: 'tokens', value: { tokens: [restTokenIdentifier] } },
        duration: HistoryDuration.DAY,
        chainIds: marketsEnabledChainIds,
      },
      enabled: isMultichainAggregation,
      select: selectMultichainMarketStatsData,
    }),
  )
  const market = isMultichainAggregation ? multichainRestMarket : singleChainRestMarket
  const isMarketLoading = isMultichainAggregation ? isMultichainMarketLoading : isSingleChainMarketLoading

  return useMemo(() => {
    return {
      ...computeTokenMarketStats({
        market,
        currentPrice: currentPriceOverride,
      }),
      isLoading: isMarketLoading,
    }
  }, [currentPriceOverride, market, isMarketLoading])
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
    descriptionTranslations: token.project?.descriptionTranslations,
    homepageUrl: token.project?.homepageUrl,
    twitterName: normalizeTwitterHandle(token.project?.twitterName),
    isSpam: token.safety?.isSpam,
  }
}

export interface UseTokenMetadataResult extends TokenMetadataData {
  /** True only while the REST metadata request is in flight with no cached data to show yet. */
  isLoading: boolean
}

export function useTokenMetadata(currencyId: CurrencyId | undefined): UseTokenMetadataResult {
  const restTokenIdentifier = useMemo(
    () => (currencyId ? currencyIdToRestContractInput(currencyId) : undefined),
    [currencyId],
  )
  const { data, isLoading } = useQuery(
    getGetTokenQueryOptions({
      params: restTokenIdentifier,
      enabled: !!restTokenIdentifier,
      select: selectTokenMetadata,
    }),
  )

  return useMemo(() => ({ ...data, isLoading }), [data, isLoading])
}
