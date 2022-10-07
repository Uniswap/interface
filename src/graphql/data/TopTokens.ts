import graphql from 'babel-plugin-relay/macro'
import {
  favoritesAtom,
  filterStringAtom,
  filterTimeAtom,
  showFavoritesAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod,
} from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import { fetchQuery, useLazyLoadQuery, useRelayEnvironment } from 'react-relay'

import type { Chain, TopTokens100Query } from './__generated__/TopTokens100Query.graphql'
import { TopTokensSparklineQuery } from './__generated__/TopTokensSparklineQuery.graphql'
import { filterPrices, PricePoint } from './Token'
import { toHistoryDuration } from './util'

const topTokens100Query = graphql`
  query TopTokens100Query($duration: HistoryDuration!, $chain: Chain!) {
    topTokens(pageSize: 100, page: 1, chain: $chain) {
      id @required(action: LOG)
      name
      chain @required(action: LOG)
      address @required(action: LOG)
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

// export const tokenSparklineFragment = graphql`
//   fragment TopTokensSparklineFragment on Query {
//     tokens(contracts: $contracts) {
//       market(currency: USD) {
//         priceHistory(duration: $duration) {
//           timestamp
//           value
//         }
//       }
//     }
//   }
// `

const tokenSparklineQuery = graphql`
  query TopTokensSparklineQuery($duration: HistoryDuration!, $chain: Chain!) {
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

export type PrefetchedTopToken = NonNullable<TopTokens100Query['response']['topTokens']>[number]

function useSortedTokens(tokens: TopTokens100Query['response']['topTokens'] | undefined) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  return useMemo(() => {
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

    return sortAscending ? tokenArray.reverse() : tokenArray
  }, [tokens, sortMethod, sortAscending])
}

function useFilteredTokens(tokens: NonNullable<TopTokens100Query['response']>['topTokens']) {
  const filterString = useAtomValue(filterStringAtom)
  const favorites = useAtomValue(favoritesAtom)
  const showFavorites = useAtomValue(showFavoritesAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
    if (!tokens) {
      return []
    }

    let returnTokens = tokens
    if (showFavorites) {
      returnTokens = returnTokens?.filter((token) => token?.address && favorites.includes(token.address))
    }
    if (lowercaseFilterString) {
      returnTokens = returnTokens?.filter((token) => {
        const addressIncludesFilterString = token?.address?.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = token?.name?.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = token?.symbol?.toLowerCase().includes(lowercaseFilterString)
        return nameIncludesFilterString || symbolIncludesFilterString || addressIncludesFilterString
      })
    }
    return returnTokens
  }, [tokens, showFavorites, lowercaseFilterString, favorites])
}

// Number of items to render in each fetch in infinite scroll.
export const PAGE_SIZE = 20

function toContractInput(token: PrefetchedTopToken) {
  return {
    address: token?.address ?? '',
    chain: token?.chain ?? 'ETHEREUM',
  }
}

export type TopToken = NonNullable<NonNullable<TopTokens100Query['response']>['topTokens']>[number]
export type SparklineMap = { [key: string]: PricePoint[] | undefined }
interface UseTopTokensReturnValue {
  error: Error | undefined
  loading: boolean
  tokens: TopToken[] | undefined
  sparklines: SparklineMap
  hasMore: boolean
  loadMoreTokens: () => void
  loadingRowCount: number
}

export function useTopTokens2(chain: Chain): UseTopTokensReturnValue {
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))

  const environment = useRelayEnvironment()
  const [sparklines, setSparklines] = useState<SparklineMap>({})
  useMemo(() => {
    fetchQuery<TopTokensSparklineQuery>(environment, tokenSparklineQuery, {
      duration,
      chain,
    }).subscribe({
      next(data) {
        const map: SparklineMap = {}
        data.topTokens?.forEach(
          (current) => current?.address && (map[current.address] = filterPrices(current?.market?.priceHistory))
        )
        setSparklines(map)
      },
    })
  }, [chain, duration, environment])

  const tokens = useFilteredTokens(
    useLazyLoadQuery<TopTokens100Query>(topTokens100Query, { duration, chain }).topTokens
  )

  return {
    tokens: useSortedTokens(tokens),
    sparklines,
    error: undefined,
    loading: false,
    hasMore: false,
    loadMoreTokens: () => console.log('huh'),
    loadingRowCount: 10,
  }
}
// export function useTopTokens(chain: Chain): UseTopTokensReturnValue {
//   const duration = toHistoryDuration(useAtomValue(filterTimeAtom))
//   const [loadingTokensWithoutPriceHistory, setLoadingTokensWithoutPriceHistory] = useState(true)
//   const [loadingTokensWithPriceHistory, setLoadingTokensWithPriceHistory] = useState(true)
//   const [tokens, setTokens] = useState<TopToken[]>()
//   const [prefetchedData, setPrefetchedData] = useState<PrefetchedTopToken[]>()
//   if (chain !== cachedChain) {
//     cachedChain = chain
//     resetTokensWithPriceHistoryCache()
//   }
//   const [page, setPage] = useState(0)
//   const [error, setError] = useState<Error | undefined>()
//   const [prefetchedDataDuration, setPrefetchedDataDuration] = useState<HistoryDuration>()
//   const prefetchedSelectedTokensWithoutPriceHistory = useFilteredTokens(useSortedTokens(prefetchedData))
//   const { everyTokenInCache, cachedTokens } = useMemo(
//     () => checkIfAllTokensCached(duration, prefetchedSelectedTokensWithoutPriceHistory),
//     [duration, prefetchedSelectedTokensWithoutPriceHistory]
//   )
//   // loadingRowCount defaults to PAGE_SIZE when no prefetchedData is available yet because the initial load
//   // count will always be PAGE_SIZE.
//   const loadingRowCount = useMemo(
//     () => (prefetchedData ? Math.min(prefetchedSelectedTokensWithoutPriceHistory.length, PAGE_SIZE) : PAGE_SIZE),
//     [prefetchedSelectedTokensWithoutPriceHistory, prefetchedData]
//   )

//   const hasMore = !tokens || tokens.length < prefetchedSelectedTokensWithoutPriceHistory.length
//   const environment = useRelayEnvironment()

//   const loadTokensWithoutPriceHistory = useCallback(
//     ({ duration, chain }: { duration: HistoryDuration; chain: Chain }) => {
//       setTokens([])
//       fetchQuery<TopTokens100Query>(
//         environment,
//         topTokens100Query,
//         { duration, chain },
//         { fetchPolicy: 'store-or-network' }
//       ).subscribe({
//         next: (data) => {
//           if (data?.topTokens) setPrefetchedData([...data?.topTokens])
//         },
//         error: setError,
//         complete: () => {
//           setLoadingTokensWithoutPriceHistory(false)
//           setPrefetchedDataDuration(duration)
//           setLoadingTokensWithPriceHistory(true)
//         },
//       })
//     },
//     [environment]
//   )

//   // TopTokens should ideally be fetched with usePaginationFragment. The backend does not current support graphql cursors;
//   // in the meantime, fetchQuery is used, as other relay hooks do not allow the refreshing and lazy loading we need
//   const loadTokensWithPriceHistory = useCallback(
//     ({
//       contracts,
//       appendingTokens,
//       page,
//       tokens,
//     }: {
//       contracts: ContractInput[]
//       appendingTokens: boolean
//       page: number
//       tokens?: TopToken[]
//     }) => {
//       fetchQuery<TopTokens_TokensQuery>(
//         environment,
//         tokensQuery,
//         { contracts, duration },
//         { fetchPolicy: 'store-or-network' }
//       ).subscribe({
//         next: (data) => {
//           if (data?.tokens) {
//             const priceHistoryCacheForCurrentDuration = tokensWithPriceHistoryCache[duration]
//             data.tokens.map((token) =>
//               !!token ? (priceHistoryCacheForCurrentDuration[`${token.chain}${token.address}`] = token) : null
//             )
//             appendingTokens ? setTokens([...(tokens ?? []), ...data.tokens]) : setTokens([...data.tokens])
//             setLoadingTokensWithPriceHistory(false)
//             setPage(page + 1)
//           }
//         },
//         error: setError,
//         complete: () => setLoadingTokensWithPriceHistory(false),
//       })
//     },
//     [duration, environment]
//   )

//   const loadMoreTokens = useCallback(() => {
//     setLoadingTokensWithPriceHistory(true)
//     const contracts = prefetchedSelectedTokensWithoutPriceHistory
//       .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
//       .map(toContractInput)
//     loadTokensWithPriceHistory({ contracts, appendingTokens: true, page, tokens })
//   }, [prefetchedSelectedTokensWithoutPriceHistory, page, loadTokensWithPriceHistory, tokens])

//   // Load tokens from cache when everything is available.
//   useEffect(() => {
//     if (everyTokenInCache) {
//       setTokens(cachedTokens)
//       setLoadingTokensWithPriceHistory(false)
//     }
//   }, [everyTokenInCache, cachedTokens])

//   // Load new token with price history data when prefetchedSelectedTokensWithoutPriceHistory for current
//   // duration has already been resolved.
//   useEffect(() => {
//     if (!everyTokenInCache) {
//       setLoadingTokensWithPriceHistory(true)
//       setTokens([])
//       if (duration === prefetchedDataDuration) {
//         const contracts = prefetchedSelectedTokensWithoutPriceHistory.slice(0, PAGE_SIZE).map(toContractInput)
//         loadTokensWithPriceHistory({ contracts, appendingTokens: false, page: 0 })
//       }
//     }
//   }, [
//     everyTokenInCache,
//     prefetchedSelectedTokensWithoutPriceHistory,
//     loadTokensWithPriceHistory,
//     duration,
//     prefetchedDataDuration,
//   ])

//   // Trigger fetching top 100 tokens without price history on first load, and on
//   // each change of chain or duration.
//   useEffect(() => {
//     setLoadingTokensWithoutPriceHistory(true)
//     loadTokensWithoutPriceHistory({ duration, chain })
//   }, [chain, duration, loadTokensWithoutPriceHistory])

//   return {
//     error,
//     loading: loadingTokensWithPriceHistory || loadingTokensWithoutPriceHistory,
//     tokens,
//     hasMore,
//     loadMoreTokens,
//     loadingRowCount,
//   }
// }
