import graphql from 'babel-plugin-relay/macro'
import { filterTimeAtom, sortAscendingAtom, sortMethodAtom } from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLazyLoadQuery } from 'react-relay'

import { TopTokens_TokensQuery } from './__generated__/TopTokens_TokensQuery.graphql'
import type { TopTokens100Query } from './__generated__/TopTokens100Query.graphql'
import { toHistoryDuration, useCurrentChainName } from './util'

export function usePrefetchTopTokens() {
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))
  const chain = useCurrentChainName()

  const top100 = useLazyLoadQuery<TopTokens100Query>(topTokens100Query, { duration, chain })
  return top100
}

const topTokens100Query = graphql`
  query TopTokens100Query($duration: HistoryDuration!, $chain: Chain!) {
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
    }
  }
`

export enum TokenSortMethod {
  PRICE = 'Price',
  PERCENT_CHANGE = 'Change',
  TOTAL_VALUE_LOCKED = 'TVL',
  VOLUME = 'Volume',
}

function sortTopTokens(
  tokens: TopTokens100Query['response']['topTokens'],
  sortMethod: TokenSortMethod,
  ascending?: boolean
) {
  if (!tokens) return []

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

  return ascending ? tokenArray.reverse() : tokenArray
}

const PAGE_SIZE = 20
//const MAX_COUNT = 100

export type TopToken = NonNullable<TopTokens100Query['response']['topTokens']>[number]

export function useTopTokens(prefetchedTokens: TopTokens100Query['response']) {
  // TODO: add filtering by favorites and filter string
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)
  const chain = useCurrentChainName()

  const [count, setCount] = useState(PAGE_SIZE)
  const sortedTop100 = useMemo(
    () => sortTopTokens(prefetchedTokens.topTokens, sortMethod, sortAscending),
    [prefetchedTokens, sortMethod, sortAscending]
  )

  const contracts = sortedTop100.slice(0, count).map((token) => {
    return {
      address: token?.address ?? '',
      chain,
    }
  })
  const topTokensData = useLazyLoadQuery<TopTokens_TokensQuery>(tokensQuery, { contracts, duration })

  // Function to pass into react.window InfiniteLoader
  const loadMoreTokens = useCallback(() => setCount(count + PAGE_SIZE), [setCount, count])

  // Reset count when filters are changed
  useEffect(() => {
    setCount(PAGE_SIZE)
  }, [sortMethod])

  return { tokens: topTokensData.tokens, loadMoreTokens }
}

export const tokensQuery = graphql`
  query TopTokens_TokensQuery($contracts: [ContractInput!]!, $duration: HistoryDuration!) {
    tokens(contracts: $contracts) {
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
        priceHistory(duration: $duration) {
          timestamp
          value
        }
        price {
          value
          currency
        }
        volume(duration: $duration) {
          value
          currency
        }
        pricePercentChange(duration: $duration) {
          currency
          value
        }
      }
    }
  }
`

// export function useTopTokenSearch(filter: string) {
//   const debouncedSearchTerm = useDebounce(filter, ms`0.5s`)
//   const searchResults = useLazyLoadQuery(TokenSearchQuery, { searchQuery: debouncedSearchTerm })
//   return searchResults
// }

// const TokenSearchQuery = graphql`
//   query TopTokensSearchQuery($searchQuery: String!) {
//     searchTokens(searchQuery: $searchQuery) {
//       name
//       market(currency: USD) {
//         totalValueLocked {
//           value
//           currency
//         }
//         price {
//           value
//           currency
//         }
//         pricePercentChange(duration: $duration) {
//           currency
//           value
//         }
//         volume(duration: $duration) {
//           value
//           currency
//         }
//       }
//     }
//   }
// `
