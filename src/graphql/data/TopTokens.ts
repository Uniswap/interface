import graphql from 'babel-plugin-relay/macro'
import {
  filterStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod,
} from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useEffect, useMemo, useState } from 'react'
import { fetchQuery, useLazyLoadQuery, useRelayEnvironment } from 'react-relay'

import type { Chain, TopTokens100Query } from './__generated__/TopTokens100Query.graphql'
import { TopTokensSparklineQuery } from './__generated__/TopTokensSparklineQuery.graphql'
import { isPricePoint, PricePoint } from './util'
import { CHAIN_NAME_TO_CHAIN_ID, toHistoryDuration, unwrapToken } from './util'

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

const tokenSparklineQuery = graphql`
  query TopTokensSparklineQuery($duration: HistoryDuration!, $chain: Chain!) {
    topTokens(pageSize: 100, page: 1, chain: $chain) {
      address
      market(currency: USD) {
        priceHistory(duration: $duration) {
          timestamp @required(action: LOG)
          value @required(action: LOG)
        }
      }
    }
  }
`

function useSortedTokens(tokens: NonNullable<TopTokens100Query['response']['topTokens']>) {
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

function useFilteredTokens(tokens: NonNullable<TopTokens100Query['response']['topTokens']>) {
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

export type TopToken = NonNullable<NonNullable<TopTokens100Query['response']>['topTokens']>[number]
export type SparklineMap = { [key: string]: PricePoint[] | undefined }
interface UseTopTokensReturnValue {
  tokens: TopToken[] | undefined
  sparklines: SparklineMap
}

export function useTopTokens(chain: Chain): UseTopTokensReturnValue {
  const chainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))

  const environment = useRelayEnvironment()
  const [sparklines, setSparklines] = useState<SparklineMap>({})
  useEffect(() => {
    const subscription = fetchQuery<TopTokensSparklineQuery>(environment, tokenSparklineQuery, { duration, chain })
      .map((data) => ({
        topTokens: data.topTokens?.map((token) => unwrapToken(chainId, token)),
      }))
      .subscribe({
        next(data) {
          const map: SparklineMap = {}
          data.topTokens?.forEach(
            (current) =>
              current?.address && (map[current.address] = current?.market?.priceHistory?.filter(isPricePoint))
          )
          setSparklines(map)
        },
      })
    return () => subscription.unsubscribe()
  }, [chain, chainId, duration, environment])

  useEffect(() => {
    setSparklines({})
  }, [duration])

  const { topTokens } = useLazyLoadQuery<TopTokens100Query>(topTokens100Query, { duration, chain })
  const mappedTokens = useMemo(() => topTokens?.map((token) => unwrapToken(chainId, token)) ?? [], [chainId, topTokens])
  const filteredTokens = useFilteredTokens(mappedTokens)
  const sortedTokens = useSortedTokens(filteredTokens)
  return useMemo(() => ({ tokens: sortedTokens, sparklines }), [sortedTokens, sparklines])
}
