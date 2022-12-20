import {
  filterStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod,
} from 'components/Tokens/state'
import gql from 'graphql-tag'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

import {
  Chain,
  TopTokens100Query,
  useTopTokens100Query,
  useTopTokensSparklineQuery,
} from './__generated__/types-and-hooks'
import { CHAIN_NAME_TO_CHAIN_ID, isPricePoint, PricePoint, toHistoryDuration, unwrapToken } from './util'

gql`
  query TopTokens100($duration: HistoryDuration!, $chain: Chain!) {
    topTokens(pageSize: 100, page: 1, chain: $chain) {
      id
      name
      chain
      address
      symbol
      market(currency: USD) {
        totalValueLocked {
          value
          currency
        }
        price {
          value
          currency
        }
        pricePercentChange(duration: $duration) {
          currency
          value
        }
        volume(duration: $duration) {
          value
          currency
        }
      }
      project {
        logoUrl
      }
    }
  }
`

gql`
  query TopTokensSparkline($duration: HistoryDuration!, $chain: Chain!) {
    topTokens(pageSize: 100, page: 1, chain: $chain) {
      address
      market(currency: USD) {
        priceHistory(duration: $duration) {
          timestamp
          value
        }
      }
    }
  }
`

function useSortedTokens(tokens: NonNullable<TopTokens100Query['topTokens']>) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  return useMemo(() => {
    let tokenArray = Array.from(tokens)
    switch (sortMethod) {
      case TokenSortMethod.PRICE:
        tokenArray = tokenArray.sort((a, b) => (b?.market?.price?.value ?? 0) - (a?.market?.price?.value ?? 0))
        break
      case TokenSortMethod.PERCENT_CHANGE:
        tokenArray = tokenArray.sort(
          (a, b) => (b?.market?.pricePercentChange?.value ?? 0) - (a?.market?.pricePercentChange?.value ?? 0)
        )
        break
      case TokenSortMethod.TOTAL_VALUE_LOCKED:
        tokenArray = tokenArray.sort(
          (a, b) => (b?.market?.totalValueLocked?.value ?? 0) - (a?.market?.totalValueLocked?.value ?? 0)
        )
        break
      case TokenSortMethod.VOLUME:
        tokenArray = tokenArray.sort((a, b) => (b?.market?.volume?.value ?? 0) - (a?.market?.volume?.value ?? 0))
        break
    }

    return sortAscending ? tokenArray.reverse() : tokenArray
  }, [tokens, sortMethod, sortAscending])
}

function useFilteredTokens(tokens: NonNullable<TopTokens100Query['topTokens']>) {
  const filterString = useAtomValue(filterStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
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

// Number of items to render in each fetch in infinite scroll.
export const PAGE_SIZE = 20
export type SparklineMap = { [key: string]: PricePoint[] | undefined }
export type TopToken = NonNullable<NonNullable<TopTokens100Query>['topTokens']>[number]

interface UseTopTokensReturnValue {
  tokens: TopToken[] | undefined
  loadingTokens: boolean
  sparklines: SparklineMap
}

export function useTopTokens(chain: Chain): UseTopTokensReturnValue {
  const chainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))

  const { data: sparklineQuery } = useTopTokensSparklineQuery({
    variables: { duration, chain },
  })

  const sparklines = useMemo(() => {
    const unwrappedTokens = sparklineQuery?.topTokens?.map((topToken) => unwrapToken(chainId, topToken))
    const map: SparklineMap = {}
    unwrappedTokens?.forEach(
      (current) => current?.address && (map[current.address] = current?.market?.priceHistory?.filter(isPricePoint))
    )
    return map
  }, [chainId, sparklineQuery?.topTokens])

  const { data, loading: loadingTokens } = useTopTokens100Query({
    variables: { duration, chain },
  })
  const mappedTokens = useMemo(
    () => data?.topTokens?.map((token) => unwrapToken(chainId, token)) ?? [],
    [chainId, data]
  )
  const filteredTokens = useFilteredTokens(mappedTokens)
  const sortedTokens = useSortedTokens(filteredTokens)
  return useMemo(() => ({ tokens: sortedTokens, loadingTokens, sparklines }), [loadingTokens, sortedTokens, sparklines])
}
