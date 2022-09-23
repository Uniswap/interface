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

import { ContractInput, HistoryDuration, TopTokens_TokensQuery } from './__generated__/TopTokens_TokensQuery.graphql'
import type { TopTokens100Query } from './__generated__/TopTokens100Query.graphql'
import { toHistoryDuration } from './util'
import { useCurrentChainName } from './util'

export function usePrefetchTopTokens(duration: HistoryDuration) {
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

const checkIfAllTokensCached = (prefetchedSelectedTokens: PrefetchedTopToken[]) => {
  let everyTokenHasBeenPreloaded = true
  const preloadedSelectedTokens: TopToken[] = []
  prefetchedSelectedTokens.map((token) =>
    !!token && `${token.chain.toString()}${token.address}` in tokensWithPriceHistoryCache
      ? preloadedSelectedTokens.push(tokensWithPriceHistoryCache[`${token.chain.toString()}${token.address}`])
      : (everyTokenHasBeenPreloaded = false)
  )
  return { everyTokenHasBeenPreloaded, preloadedSelectedTokens }
}

export type TopToken = NonNullable<TopTokens_TokensQuery['response']['tokens']>[number]
export function useTopTokens() {
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState<TopToken[]>()
  const [page, setPage] = useState(0)
  const prefetchedData = usePrefetchTopTokens(duration)
  const prefetchedSelectedTokensWithoutPriceHistory = useFilteredTokens(useSortedTokens(prefetchedData.topTokens))

  const hasMore = !tokens || tokens.length < prefetchedSelectedTokensWithoutPriceHistory.length

  const environment = useRelayEnvironment()

  // TopTokens should ideally be fetched with usePaginationFragment. The backend does not current support graphql cursors;
  // in the meantime, fetchQuery is used, as other relay hooks do not allow the refreshing and lazy loading we need
  const loadTokens = useCallback(
    (contracts: ContractInput[], onSuccess: (data: TopTokens_TokensQuery['response'] | undefined) => void) => {
      fetchQuery<TopTokens_TokensQuery>(
        environment,
        tokensQuery,
        { contracts, duration },
        { fetchPolicy: 'store-or-network' }
      )
        .toPromise()
        .then(onSuccess)
    },
    [duration, environment]
  )

  const loadMoreTokens = useCallback(() => {
    setLoading(true)
    const contracts = prefetchedSelectedTokensWithoutPriceHistory
      .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
      .map(toContractInput)
    loadTokens(contracts, (data) => {
      if (data?.tokens) {
        data.tokens.forEach((token) =>
          !!token ? (tokensWithPriceHistoryCache[`${token.chain.toString()}${token.address}`] = token) : null
        )
        setTokens([...(tokens ?? []), ...data.tokens])
        setLoading(false)
        setPage(page + 1)
      }
    })
  }, [prefetchedSelectedTokensWithoutPriceHistory, page, loadTokens, tokens])

  // Reset count when filters are changed
  useLayoutEffect(() => {
    const { everyTokenHasBeenPreloaded, preloadedSelectedTokens } = checkIfAllTokensCached(
      prefetchedSelectedTokensWithoutPriceHistory
    )
    if (everyTokenHasBeenPreloaded) {
      setTokens([...preloadedSelectedTokens])
      setLoading(false)
      return
    } else {
      setLoading(true)
      setTokens([])
      const contracts = prefetchedSelectedTokensWithoutPriceHistory.slice(0, PAGE_SIZE).map(toContractInput)
      loadTokens(contracts, (data) => {
        if (data?.tokens) {
          data.tokens.forEach((token) =>
            !!token ? (tokensWithPriceHistoryCache[`${token.chain.toString()}${token.address}`] = token) : null
          )
          // @ts-ignore prevent typescript from complaining about readonly data
          setTokens(data.tokens)
          setLoading(false)
          setPage(1)
        }
      })
    }
  }, [loadTokens, prefetchedSelectedTokensWithoutPriceHistory])

  return { loading, tokens, hasMore, tokenCount: prefetchedSelectedTokensWithoutPriceHistory.length, loadMoreTokens }
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
