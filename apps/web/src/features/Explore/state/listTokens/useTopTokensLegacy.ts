import {
  ExploreStatsResponse,
  Amount,
  PriceHistory,
  TokenStats,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useExploreStatsQuery } from 'uniswap/src/data/rest/exploreStats'
import { PricePoint, TimePeriod } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { useExploreChainId } from '~/features/Explore/state'
import { UseListTokensOptions, type UseListTokensSortOptions } from '~/features/Explore/state/listTokens/types'
import { TokenSortMethods } from '~/features/Explore/state/listTokens/utils/sortTokens'
import { TokenStat } from '~/types/explore'

function convertPriceHistoryToPricePoints(priceHistory?: PriceHistory): PricePoint[] | undefined {
  return priceHistory?.values.map((value, index) => {
    return {
      timestamp: Number(priceHistory.start) + index * Number(priceHistory.step),
      value,
    }
  })
}

function convertTokenStatsToTokenStat(tokenStats: TokenStats, duration: TimePeriod): TokenStat {
  let volume: Amount | undefined
  let priceHistory: PricePoint[] | undefined
  switch (duration) {
    case TimePeriod.HOUR:
      volume = tokenStats.volume1Hour
      priceHistory = convertPriceHistoryToPricePoints(tokenStats.priceHistoryHour)
      break
    case TimePeriod.DAY:
      volume = tokenStats.volume1Day
      priceHistory = convertPriceHistoryToPricePoints(tokenStats.priceHistoryDay)
      break
    case TimePeriod.WEEK:
      volume = tokenStats.volume1Week
      priceHistory = convertPriceHistoryToPricePoints(tokenStats.priceHistoryWeek)
      break
    case TimePeriod.MONTH:
      volume = tokenStats.volume1Month
      priceHistory = convertPriceHistoryToPricePoints(tokenStats.priceHistoryMonth)
      break
    case TimePeriod.YEAR:
      volume = tokenStats.volume1Year
      priceHistory = convertPriceHistoryToPricePoints(tokenStats.priceHistoryYear)
      break
    default:
      volume = tokenStats.volume1Day
      priceHistory = convertPriceHistoryToPricePoints(tokenStats.priceHistoryDay)
  }
  return {
    // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
    ...tokenStats,
    priceHistory,
    volume,
  } as TokenStat
}

function useSortedTokens({
  tokens,
  sortOptions,
}: {
  tokens: TokenStat[] | undefined
  sortOptions: UseListTokensSortOptions
}): TokenStat[] | undefined {
  const { sortMethod, sortAscending } = sortOptions

  return useMemo(() => {
    if (!tokens) {
      return undefined
    }
    // PRICE sort is done in processMultichainTokensForDisplay after convert to multichain; avoid duplicate sort here.
    if (sortMethod === TokenSortMethod.PRICE) {
      return tokens
    }
    const tokenArray = Array.from(tokens).sort(TokenSortMethods[sortMethod])
    return sortAscending ? tokenArray.reverse() : tokenArray
  }, [tokens, sortMethod, sortAscending])
}

/**
 * Legacy hook that uses ExploreStats (ConnectRPC) with client-side sorting only (no filter, no slice).
 * Default: chain from ExploreContextProvider. Returns grouped tokens when multichain is true.
 * Filter and PRICE sort are done in processMultichainTokensForDisplay; slice in useListTokens.
 *
 * @param enabled - Whether to process the data. When false, returns empty results.
 * @param options - Resolved sort and filter options (duration + sort used here; filter applied later).
 * @param multichain
 */
export function useTopTokensLegacy({
  enabled,
  options,
  multichain = false,
}: {
  enabled: boolean
  options: Required<UseListTokensOptions>
  multichain?: boolean
}) {
  const { filterTimePeriod: duration, sortMethod, sortAscending } = options
  const chainId = useExploreChainId()
  const tokensV2EndpointsEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)

  const {
    data,
    isLoading,
    error: isError,
  } = useExploreStatsQuery<ExploreStatsResponse>({
    input: { chainId, multichain },
    enabled: enabled && !tokensV2EndpointsEnabled,
  })

  const tokenStats = useMemo(() => {
    if (!enabled) {
      return undefined
    }
    return data?.stats?.tokenStats.map((tokenStat: TokenStats) => convertTokenStatsToTokenStat(tokenStat, duration))
  }, [enabled, data?.stats?.tokenStats, duration])

  const sortedTokenStats = useSortedTokens({
    tokens: tokenStats,
    sortOptions: { sortMethod, sortAscending },
  })

  return { topTokens: sortedTokenStats, isLoading, isError: !!isError }
}
