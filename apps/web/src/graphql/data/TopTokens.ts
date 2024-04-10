import { ApolloError } from '@apollo/client'
import {
  exploreSearchStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod,
} from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

import {
  Chain,
  TopTokens100Query,
  useTopTokens100Query,
  useTopTokensSparklineQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  isPricePoint,
  PollingInterval,
  PricePoint,
  supportedChainIdFromGQLChain,
  toHistoryDuration,
  unwrapToken,
  usePollQueryWhileMounted,
} from './util'

const TokenSortMethods = {
  [TokenSortMethod.PRICE]: (a: TopToken, b: TopToken) =>
    (b?.market?.price?.value ?? 0) - (a?.market?.price?.value ?? 0),
  [TokenSortMethod.DAY_CHANGE]: (a: TopToken, b: TopToken) =>
    (b?.market?.pricePercentChange1Day?.value ?? 0) - (a?.market?.pricePercentChange1Day?.value ?? 0),
  [TokenSortMethod.HOUR_CHANGE]: (a: TopToken, b: TopToken) =>
    (b?.market?.pricePercentChange1Hour?.value ?? 0) - (a?.market?.pricePercentChange1Hour?.value ?? 0),
  [TokenSortMethod.VOLUME]: (a: TopToken, b: TopToken) =>
    (b?.market?.volume?.value ?? 0) - (a?.market?.volume?.value ?? 0),
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: (a: TopToken, b: TopToken) =>
    (b?.project?.markets?.[0]?.fullyDilutedValuation?.value ?? 0) -
    (a?.project?.markets?.[0]?.fullyDilutedValuation?.value ?? 0),
}

function useSortedTokens(tokens: TopTokens100Query['topTokens']) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  return useMemo(() => {
    if (!tokens) return undefined
    const tokenArray = Array.from(tokens).sort(TokenSortMethods[sortMethod])

    return sortAscending ? tokenArray.reverse() : tokenArray
  }, [tokens, sortMethod, sortAscending])
}

function useFilteredTokens(tokens: TopTokens100Query['topTokens']) {
  const filterString = useAtomValue(exploreSearchStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
    if (!tokens) return undefined
    let returnTokens = tokens
    if (lowercaseFilterString) {
      returnTokens = returnTokens?.filter((token) => {
        const addressIncludesFilterString = token?.address?.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = token?.name?.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = token?.symbol?.toLowerCase().includes(lowercaseFilterString)
        return nameIncludesFilterString || symbolIncludesFilterString || addressIncludesFilterString
      })
    }
    return returnTokens
  }, [tokens, lowercaseFilterString])
}

export type SparklineMap = { [key: string]: PricePoint[] | undefined }
export type TopToken = NonNullable<NonNullable<TopTokens100Query>['topTokens']>[number]

interface UseTopTokensReturnValue {
  tokens?: readonly TopToken[]
  tokenSortRank: Record<string, number>
  loadingTokens: boolean
  sparklines: SparklineMap
  error?: ApolloError
}

export function useTopTokens(chain: Chain): UseTopTokensReturnValue {
  const chainId = supportedChainIdFromGQLChain(chain)
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))

  const { data: sparklineQuery } = usePollQueryWhileMounted(
    useTopTokensSparklineQuery({
      variables: { duration, chain },
    }),
    PollingInterval.Slow
  )

  const sparklines = useMemo(() => {
    const unwrappedTokens = chainId && sparklineQuery?.topTokens?.map((topToken) => unwrapToken(chainId, topToken))
    const map: SparklineMap = {}
    unwrappedTokens?.forEach((current) => {
      if (current?.address !== undefined) {
        map[current.address] = current?.market?.priceHistory?.filter(isPricePoint) as PricePoint[]
      }
    })
    return map
  }, [chainId, sparklineQuery?.topTokens])

  const {
    data,
    loading: loadingTokens,
    error,
  } = usePollQueryWhileMounted(
    useTopTokens100Query({
      variables: { duration, chain },
    }),
    PollingInterval.Fast
  )

  const unwrappedTokens = useMemo(
    () => chainId && data?.topTokens?.map((token) => unwrapToken(chainId, token)),
    [chainId, data]
  )
  const sortedTokens = useSortedTokens(unwrappedTokens)
  const tokenSortRank = useMemo(
    () =>
      sortedTokens?.reduce((acc, cur, i) => {
        if (!cur?.address) return acc
        return {
          ...acc,
          [cur.address]: i + 1,
        }
      }, {}) ?? {},
    [sortedTokens]
  )
  const filteredTokens = useFilteredTokens(sortedTokens)
  return useMemo(
    () => ({ tokens: filteredTokens, tokenSortRank, loadingTokens, sparklines, error }),
    [filteredTokens, tokenSortRank, loadingTokens, sparklines, error]
  )
}
