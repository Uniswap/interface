/* eslint-disable import/no-unused-modules */
import { Amount, PriceHistory, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { SparklineMap } from 'appGraphql/data/types'
import { PricePoint, TimePeriod, getTokenVolumeByTime, unwrapToken } from 'appGraphql/data/util'
import {
  RingTokenSortMethod,
  TokenSortMethod,
  exploreSearchStringAtom,
  filterRingTimeAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  sortRingMethodAtom,
} from 'components/Tokens/state'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useAtomValue } from 'jotai/utils'
import { useContext, useMemo } from 'react'
import { ExploreContext, giveExploreStatDefaultValue } from 'state/explore'
import { RingTokenStat, TokenStat } from 'state/explore/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'

const TokenSortMethods = {
  [TokenSortMethod.PRICE]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b?.price?.value) - giveExploreStatDefaultValue(a?.price?.value),
  [TokenSortMethod.DAY_CHANGE]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b?.pricePercentChange1Day?.value) -
    giveExploreStatDefaultValue(a?.pricePercentChange1Day?.value),
  [TokenSortMethod.HOUR_CHANGE]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b?.pricePercentChange1Hour?.value) -
    giveExploreStatDefaultValue(a?.pricePercentChange1Hour?.value),
  [TokenSortMethod.VOLUME]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b?.volume?.value) - giveExploreStatDefaultValue(a?.volume?.value),
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: (a: TokenStat, b: TokenStat) =>
    giveExploreStatDefaultValue(b?.fullyDilutedValuation?.value) -
    giveExploreStatDefaultValue(a?.fullyDilutedValuation?.value),
}

const RingTokenSortMethods = {
  [RingTokenSortMethod.PRICE]: (a: RingTokenStat, b: RingTokenStat) =>
    giveExploreStatDefaultValue(Number(b?.derivedETH)) - giveExploreStatDefaultValue(Number(a?.derivedETH)),
  [RingTokenSortMethod.DAY_CHANGE]: (a: RingTokenStat, b: RingTokenStat) =>
    giveExploreStatDefaultValue(b?.pricePercentChange1Day) - giveExploreStatDefaultValue(a?.pricePercentChange1Day),
  [RingTokenSortMethod.HOUR_CHANGE]: (a: RingTokenStat, b: RingTokenStat) =>
    giveExploreStatDefaultValue(b?.pricePercentChange1Hour) - giveExploreStatDefaultValue(a?.pricePercentChange1Hour),
  [RingTokenSortMethod.VOLUME]: (a: RingTokenStat, b: RingTokenStat) =>
    giveExploreStatDefaultValue(Number(b?.volume)) - giveExploreStatDefaultValue(Number(a?.volume)),
  [RingTokenSortMethod.TOTAL_VALUE_LOCKED]: (a: RingTokenStat, b: RingTokenStat) =>
    giveExploreStatDefaultValue(Number(b?.tvl)) - giveExploreStatDefaultValue(Number(a?.tvl)),
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

function useSortedRingTokens(tokens: RingTokenStat[] | undefined): RingTokenStat[] | undefined {
  const sortMethod = useAtomValue(sortRingMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  return useMemo(() => {
    if (!tokens) {
      return undefined
    }
    const tokenArray = Array.from(tokens).sort(RingTokenSortMethods[sortMethod])

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
      returnTokens = returnTokens?.filter((token) => {
        const addressIncludesFilterString = token?.address?.toLowerCase().includes(lowercaseFilterString)
        const projectNameIncludesFilterString = token?.project?.name?.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = token?.name?.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = token?.symbol?.toLowerCase().includes(lowercaseFilterString)
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

function useFilteredRingTokens(tokens: RingTokenStat[] | undefined) {
  const filterString = useAtomValue(exploreSearchStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
    if (!tokens) {
      return undefined
    }
    let returnTokens = tokens
    if (lowercaseFilterString) {
      returnTokens = returnTokens?.filter((token) => {
        const addressIncludesFilterString = token?.address?.toLowerCase().includes(lowercaseFilterString)
        const projectNameIncludesFilterString = token?.name?.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = token?.name?.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = token?.symbol?.toLowerCase().includes(lowercaseFilterString)
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
  const tokenStats = data?.stats?.tokenStats?.map((tokenStat: TokenStats) =>
    convertTokenStatsToTokenStat(tokenStat, duration),
  )
  const sortedTokenStats = useSortedTokens(tokenStats)
  const tokenSortRank = useMemo(
    () =>
      sortedTokenStats?.reduce((acc, cur, i) => {
        if (!cur?.address) {
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
      const chainId = getChainIdFromChainUrlParam(tokenStat?.chain.toLowerCase())
      return chainId ? unwrapToken(chainId, tokenStat) : undefined
    })
    const map: SparklineMap = {}
    unwrappedTokens?.forEach((current) => {
      if (current !== undefined) {
        const address = current?.address === NATIVE_CHAIN_ID ? NATIVE_CHAIN_ID : current?.address?.toLowerCase()
        map[address] = current?.priceHistory
      }
    })
    return map
  }, [filteredTokens])

  return { topTokens: filteredTokens, sparklines, tokenSortRank, isLoading, isError }
}

const blackTokenList = ['0x93f874e2c578a66c125bb12a46053f0c4ee12127']

export function useRingTopTokens() {
  const {
    ringProtocolStats: { data, isLoading, error },
  } = useContext(ExploreContext)

  const duration = useAtomValue(filterRingTimeAtom)

  const currentTime = useMemo(() => Math.floor(Date.now() / 1000), [])
  const SECONDS_IN_DAY = 86400
  const initTokenStats = data?.tokens?.items
  const ethPrice = data?.factory?.ethPrice ?? 0

  const tokenStats = useMemo(() => {
    return initTokenStats?.filter((token: RingTokenStat) => {
      const dayDataItems = token?.dayData?.items || []
      return (
        (!blackTokenList.includes(token.address.toLowerCase()) &&
          dayDataItems.length > 0 &&
          dayDataItems[0]?.date >= Number(currentTime) - 7 * SECONDS_IN_DAY) ||
        Number(token.totalValueLockedUSD) > 1_000_000
      ) // only show tokens with swap data in the last 7 days
    })
  }, [initTokenStats, currentTime])

  // calculate price change 24h and 1h
  const newTokenStats = useMemo(() => {
    return tokenStats?.map((token: RingTokenStat) => {
      const dayDataItems = [...(token?.dayData?.items || [])].sort((a, b) => Number(b.date) - Number(a.date))
      const hourDataItems = [...(token?.hourData?.items || [])].sort((a, b) => Number(b.date) - Number(a.date))

      const tvl = Number(token.totalValueLockedUSD) || Number(token.untrackedVolumeUSD)
      const volume = getTokenVolumeByTime(token, duration, currentTime)
      let pricePercentChange1Day = 0
      let pricePercentChange1Hour = 0

      // 24h change
      if (dayDataItems.length >= 1 && dayDataItems[0]?.date >= Number(currentTime) - SECONDS_IN_DAY) {
        const latestPriceUSD = Number(dayDataItems[0]?.close) || 0
        const prevPriceUSD = Number(dayDataItems[0]?.open) || 0
        if (prevPriceUSD > 0) {
          pricePercentChange1Day = ((latestPriceUSD - prevPriceUSD) / prevPriceUSD) * 100
        }
      }

      // 1h change
      if (hourDataItems.length >= 1 && hourDataItems[0]?.date >= Number(currentTime) - 3600) {
        const latestPriceUSD = Number(hourDataItems[0]?.close) || 0
        const prevPriceUSD = Number(hourDataItems[0]?.open) || 0
        if (prevPriceUSD > 0) {
          pricePercentChange1Hour = ((latestPriceUSD - prevPriceUSD) / prevPriceUSD) * 100
        }
      }

      return {
        ...token,
        tvl,
        volume,
        pricePercentChange1Day,
        pricePercentChange1Hour,
      }
    })
  }, [tokenStats, duration, currentTime])

  const sortedTokenStats = useSortedRingTokens(newTokenStats)
  const filteredTokens = useFilteredRingTokens(sortedTokenStats)?.slice(0, MAX_TOP_TOKENS)

  const tokenSortRank = useMemo(
    () =>
      sortedTokenStats?.reduce((acc, cur, i) => {
        if (!cur?.address) {
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

  const sparklines = useMemo(() => {
    const unwrappedTokens = filteredTokens?.map((tokenStat) => {
      const chainId = getChainIdFromChainUrlParam(tokenStat?.chain.toLowerCase())
      return chainId ? unwrapToken(chainId, tokenStat) : undefined
    })
    const map: SparklineMap = {}
    unwrappedTokens?.forEach((current) => {
      if (current !== undefined) {
        const address = current?.address === NATIVE_CHAIN_ID ? NATIVE_CHAIN_ID : current?.address?.toLowerCase()
        map[address] = current?.hourData?.items
          .filter((item) => item.date >= Number(currentTime) - 24 * 3600)
          .map((item) => ({
            timestamp: Number(item.date),
            value: Number(item.priceUSD),
          }))
          .sort((a, b) => a.timestamp - b.timestamp)

        if (map[address] && map[address]?.length === 0) {
          map[address] = [
            {
              timestamp: currentTime,
              value: 1,
            },
            {
              timestamp: currentTime - 1,
              value: 1,
            },
          ]
        }
      }
    })
    return map
  }, [filteredTokens, currentTime])

  return { topTokens: filteredTokens, sparklines, ethPrice, tokenSortRank, isLoading, error }
}
