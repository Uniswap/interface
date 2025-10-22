import { SparklineMap } from 'appGraphql/data/types'
import { PricePoint, TimePeriod, unwrapToken } from 'appGraphql/data/util'
import { Amount, PriceHistory, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import {
  exploreSearchStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod,
} from 'components/Tokens/state'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useAtomValue } from 'jotai/utils'
import { useContext, useMemo } from 'react'
import { ExploreContext, giveExploreStatDefaultValue } from 'state/explore'
import { TokenStat } from 'state/explore/types'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'

const TokenSortMethods = {
  [TokenSortMethod.PRICE]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.price?.value) - giveExploreStatDefaultValue(a.price?.value),
  [TokenSortMethod.DAY_CHANGE]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.pricePercentChange1Day?.value) -
    giveExploreStatDefaultValue(a.pricePercentChange1Day?.value),
  [TokenSortMethod.HOUR_CHANGE]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.pricePercentChange1Hour?.value) -
    giveExploreStatDefaultValue(a.pricePercentChange1Hour?.value),
  [TokenSortMethod.VOLUME]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.volume?.value) - giveExploreStatDefaultValue(a.volume?.value),
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b.fullyDilutedValuation?.value) -
    giveExploreStatDefaultValue(a.fullyDilutedValuation?.value),
}

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

function useSortedTokens(tokens: TokenStat[] | undefined): TokenStat[] | undefined {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  return useMemo(() => {
    if (!tokens) {
      return undefined
    }
    const tokenArray = Array.from(tokens).sort(TokenSortMethods[sortMethod])

    return sortAscending ? tokenArray.reverse() : tokenArray
  }, [tokens, sortMethod, sortAscending])
}

function useFilteredTokens(tokens: TokenStat[] | undefined) {
  const filterString = useAtomValue(exploreSearchStringAtom)

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

const MAX_TOP_TOKENS = 100

export function useTopTokens() {
  const duration = useAtomValue(filterTimeAtom)
  const {
    exploreStats: { data, isLoading, error: isError },
  } = useContext(ExploreContext)
  const tokenStats = data?.stats?.tokenStats.map((tokenStat: TokenStats) =>
    convertTokenStatsToTokenStat(tokenStat, duration),
  )
  const sortedTokenStats = useSortedTokens(tokenStats)
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
  const filteredTokens = useFilteredTokens(sortedTokenStats)?.slice(0, MAX_TOP_TOKENS)
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
