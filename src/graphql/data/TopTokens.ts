import graphql from 'babel-plugin-relay/macro'
import {
  favoritesAtom,
  filterStringAtom,
  filterTimeAtom,
  showFavoritesAtom,
  sortAscendingAtom,
  sortMethodAtom,
} from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useCallback, useLayoutEffect, useMemo, useState } from 'react'
import { fetchQuery, useLazyLoadQuery, useRelayEnvironment } from 'react-relay'

import {
  Chain,
  ContractInput,
  HistoryDuration,
  TopTokens_TokensQuery,
} from './__generated__/TopTokens_TokensQuery.graphql'
import type { TopTokens100Query } from './__generated__/TopTokens100Query.graphql'
import { toHistoryDuration } from './util'

export function usePrefetchTopTokens(duration: HistoryDuration, chain: Chain) {
  return useLazyLoadQuery<TopTokens100Query>(topTokens100Query, { duration, chain })
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

export type PrefetchedTopToken = NonNullable<TopTokens100Query['response']['topTokens']>[number]

function useSortedTokens(tokens: TopTokens100Query['response']['topTokens']) {
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

function useFilteredTokens(tokens: PrefetchedTopToken[]) {
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

// Map of key: ${chain} + ${address} and value: TopToken object.
// Acts as a local cache.
const tokensWithPriceHistoryCache: Record<string, TopToken> = {}

const checkIfAllTokensCached = (tokens: PrefetchedTopToken[]) => {
  let everyTokenInCache = true
  const cachedTokens: TopToken[] = []

  const checkCache = (token: PrefetchedTopToken) => {
    const tokenCacheKey = !!token ? `${token.chain}${token.address}` : ''
    if (tokenCacheKey in tokensWithPriceHistoryCache) {
      cachedTokens.push(tokensWithPriceHistoryCache[tokenCacheKey])
      return true
    } else {
      everyTokenInCache = false
      cachedTokens.length = 0
      return false
    }
  }
  tokens.every((token) => checkCache(token))
  return { everyTokenInCache, cachedTokens }
}

export type TopToken = NonNullable<TopTokens_TokensQuery['response']['tokens']>[number]
interface UseTopTokensReturnValue {
  loading: boolean
  tokens: TopToken[] | undefined
  tokensWithoutPriceHistoryCount: number
  hasMore: boolean
  loadMoreTokens: () => void
}
export function useTopTokens(chain: Chain): UseTopTokensReturnValue {
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState<TopToken[]>()
  const [page, setPage] = useState(0)
  const prefetchedData = usePrefetchTopTokens(duration, chain)
  const prefetchedSelectedTokensWithoutPriceHistory = useFilteredTokens(useSortedTokens(prefetchedData.topTokens))

  const hasMore = !tokens || tokens.length < prefetchedSelectedTokensWithoutPriceHistory.length

  const environment = useRelayEnvironment()

  // TopTokens should ideally be fetched with usePaginationFragment. The backend does not current support graphql cursors;
  // in the meantime, fetchQuery is used, as other relay hooks do not allow the refreshing and lazy loading we need
  const loadTokensWithPriceHistory = useCallback(
    ({
      contracts,
      appendingTokens,
      page,
      tokens,
    }: {
      contracts: ContractInput[]
      appendingTokens: boolean
      page: number
      tokens?: TopToken[]
    }) => {
      fetchQuery<TopTokens_TokensQuery>(
        environment,
        tokensQuery,
        { contracts, duration },
        { fetchPolicy: 'store-or-network' }
      )
        .toPromise()
        .then((data) => {
          if (data?.tokens) {
            data.tokens.map((token) =>
              !!token ? (tokensWithPriceHistoryCache[`${token.chain}${token.address}`] = token) : null
            )
            appendingTokens ? setTokens([...(tokens ?? []), ...data.tokens]) : setTokens([...data.tokens])
            setLoading(false)
            setPage(page + 1)
          }
        })
    },
    [duration, environment]
  )

  const loadMoreTokens = useCallback(() => {
    setLoading(true)
    const contracts = prefetchedSelectedTokensWithoutPriceHistory
      .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
      .map(toContractInput)
    loadTokensWithPriceHistory({ contracts, appendingTokens: true, page, tokens })
  }, [prefetchedSelectedTokensWithoutPriceHistory, page, loadTokensWithPriceHistory, tokens])

  // Reset count when filters are changed
  useLayoutEffect(() => {
    const { everyTokenInCache, cachedTokens } = checkIfAllTokensCached(prefetchedSelectedTokensWithoutPriceHistory)
    if (everyTokenInCache) {
      setTokens(cachedTokens)
      setLoading(false)
      return
    } else {
      setLoading(true)
      setTokens([])
      const contracts = prefetchedSelectedTokensWithoutPriceHistory.slice(0, PAGE_SIZE).map(toContractInput)
      loadTokensWithPriceHistory({ contracts, appendingTokens: false, page: 0 })
    }
  }, [loadTokensWithPriceHistory, prefetchedSelectedTokensWithoutPriceHistory])

  return {
    loading,
    tokens,
    hasMore,
    tokensWithoutPriceHistoryCount: prefetchedSelectedTokensWithoutPriceHistory.length,
    loadMoreTokens,
  }
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
      project {
        logoUrl
      }
    }
  }
`
