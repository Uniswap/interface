import { Amount, PriceHistory, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { useContext, useMemo } from 'react'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { SparklineMap } from '~/appGraphql/data/types'
import { PricePoint, TimePeriod, unwrapToken } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useExploreTablesFilterStore } from '~/pages/Explore/exploreTablesFilterStore'
import { ExploreContext } from '~/state/explore'
import { EXPLORE_API_PAGE_SIZE } from '~/state/explore/constants'
import { TokenSortMethods } from '~/state/explore/topTokens/utils/sortTokens'
import { TokenStat } from '~/state/explore/types'
import { getChainIdFromChainUrlParam } from '~/utils/chainParams'

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
    ...tokenStats,
    priceHistory,
    volume,
  } as TokenStat
}

function useSortedTokens({
  tokens,
  sortMethod,
  sortAscending,
}: {
  tokens: TokenStat[] | undefined
  sortMethod: TokenSortMethod
  sortAscending: boolean
}): TokenStat[] | undefined {
  return useMemo(() => {
    if (!tokens) {
      return undefined
    }
    const tokenArray = Array.from(tokens).sort(TokenSortMethods[sortMethod])

    return sortAscending ? tokenArray.reverse() : tokenArray
  }, [tokens, sortMethod, sortAscending])
}

function useFilteredTokens(tokens: TokenStat[] | undefined) {
  const filterString = useExploreTablesFilterStore((s) => s.filterString)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
    if (!tokens) {
      return undefined
    }
    let returnTokens = tokens
    if (lowercaseFilterString) {
      returnTokens = returnTokens.filter((token) => {
        const addressIncludesFilterString = normalizeTokenAddressForCache(token.address).includes(lowercaseFilterString)
        const projectNameIncludesFilterString = token.project?.name?.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = token.name?.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = token.symbol?.toLowerCase().includes(lowercaseFilterString)
        return (
          projectNameIncludesFilterString ||
          nameIncludesFilterString ||
          symbolIncludesFilterString ||
          addressIncludesFilterString
        )
      })
    }
    return returnTokens
  }, [tokens, lowercaseFilterString])
}

/**
 * Legacy hook that uses ExploreContext with client-side sorting/filtering.
 * @param enabled - Whether to process the data (default: true). When false, skips processing and returns empty results.
 * @param sortMethod - Current sort column (caller manages state)
 * @param sortAscending - Current sort direction (caller manages state)
 */
export function useTopTokensLegacy({
  enabled,
  sortMethod,
  sortAscending,
}: {
  enabled: boolean
  sortMethod: TokenSortMethod
  sortAscending: boolean
}) {
  const duration = useExploreTablesFilterStore((s) => s.timePeriod)
  const {
    exploreStats: { data, isLoading, error: isError },
  } = useContext(ExploreContext)

  const tokenStats = useMemo(() => {
    if (!enabled) {
      return undefined
    }
    return data?.stats?.tokenStats.map((tokenStat: TokenStats) => convertTokenStatsToTokenStat(tokenStat, duration))
  }, [enabled, data?.stats?.tokenStats, duration])

  const sortedTokenStats = useSortedTokens({ tokens: tokenStats, sortMethod, sortAscending })
  const tokenSortRank = useMemo(
    () =>
      // eslint-disable-next-line max-params
      sortedTokenStats?.reduce((acc, cur, i) => {
        if (!cur.address) {
          return acc
        }
        const currCurrencyId = buildCurrencyId(fromGraphQLChain(cur.chain) ?? UniverseChainId.Mainnet, cur.address)
        return {
          ...acc,
          [currCurrencyId]: i + 1,
        }
      }, {}) ?? {},
    [sortedTokenStats],
  )
  const filteredTokens = useFilteredTokens(sortedTokenStats)?.slice(0, EXPLORE_API_PAGE_SIZE)
  const sparklines = useMemo(() => {
    const unwrappedTokens = filteredTokens?.map((tokenStat) => {
      const chainId = getChainIdFromChainUrlParam(tokenStat.chain.toLowerCase())
      return chainId ? unwrapToken(chainId, tokenStat) : undefined
    })
    const map: SparklineMap = {}
    unwrappedTokens?.forEach((current) => {
      if (current !== undefined) {
        const address =
          current.address === NATIVE_CHAIN_ID ? NATIVE_CHAIN_ID : normalizeTokenAddressForCache(current.address)
        map[address] = current.priceHistory
      }
    })
    return map
  }, [filteredTokens])

  return { topTokens: filteredTokens, sparklines, tokenSortRank, isLoading, isError }
}
