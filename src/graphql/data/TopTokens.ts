import { useQuery } from '@apollo/client'
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
import { apolloClient } from './apollo'
import {
  CHAIN_NAME_TO_CHAIN_ID,
  isPricePoint,
  PollingInterval,
  PricePoint,
  toHistoryDuration,
  unwrapToken,
  unwrapTokenRollux,
  usePollQueryWhileMounted,
} from './util'

interface Token {
  decimals: string
  feesUSD: string
  id: string
  name: string
  poolCount: string
  symbol: string
  totalSupply: string
  totalValueLocked: string
  totalValueLockedUSD: string
  totalValueLockedUSDUntracked: string
  txCount: string
  untrackedVolumeUSD: string
  volume: string
  volumeUSD: string
}

type Tokens = Array<Token>

gql`
  query TopTokens100($duration: HistoryDuration!, $chain: Chain!) {
    topTokens(pageSize: 100, page: 1, chain: $chain, orderBy: VOLUME) {
      id
      name
      chain
      address
      symbol
      standard
      market(currency: USD) {
        id
        totalValueLocked {
          id
          value
          currency
        }
        price {
          id
          value
          currency
        }
        pricePercentChange(duration: $duration) {
          id
          currency
          value
        }
        volume(duration: $duration) {
          id
          value
          currency
        }
      }
      project {
        id
        logoUrl
      }
    }
  }
`

// We separately query sparkline data so that the large download time does not block Token Explore rendering
gql`
  query TopTokensSparkline($duration: HistoryDuration!, $chain: Chain!) {
    topTokens(pageSize: 100, page: 1, chain: $chain, orderBy: VOLUME) {
      id
      address
      chain
      market(currency: USD) {
        id
        priceHistory(duration: $duration) {
          id
          timestamp
          value
        }
      }
    }
  }
`

// We create a query data to get some tokens info on rollux subgraph
const TOPTOKENS = gql`
  query TopTokensRollux {
    tokens(first: 50, orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
      id
      symbol
      name
      decimals
      totalSupply
      volume
      volumeUSD
      untrackedVolumeUSD
      feesUSD
      txCount
      poolCount
      totalValueLocked
      totalValueLockedUSD
      totalValueLockedUSDUntracked
    }
  }
`

function useSortedTokens(tokens: TopTokens100Query['topTokens']) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  return useMemo(() => {
    if (!tokens) return undefined
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

function useFilteredTokens(tokens: TopTokens100Query['topTokens']) {
  const filterString = useAtomValue(filterStringAtom)

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

// Number of items to render in each fetch in infinite scroll.
export const PAGE_SIZE = 20
export type SparklineMap = { [key: string]: PricePoint[] | undefined }
export type TopToken = NonNullable<NonNullable<TopTokens100Query>['topTokens']>[number]

interface UseTopTokensReturnValue {
  tokens: TopToken[] | undefined
  tokenSortRank: Record<string, number>
  loadingTokens: boolean
  sparklines: SparklineMap
}

export function useTopTokens(chain: Chain): UseTopTokensReturnValue {
  const chainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))
  // console.log('=============duration=======================')
  // console.log(duration)
  // console.log('====================================')

  // console.log('===============chain=====================')
  // console.log(chain)
  // console.log('====================================')

  const { loading, error, data: tokens } = useQuery<Tokens>(TOPTOKENS, { client: apolloClient })

  // const { loading, error, data: tokensPrice } = useQuery<Tokens>(asd, { client: apolloClient })
  console.log('=================test query===================')
  console.log('loading', loading)
  console.log('error', error)
  console.log('Test', tokens)
  console.log('====================================')

  const { data: sparklineQuery } = usePollQueryWhileMounted(
    useTopTokensSparklineQuery({
      variables: { duration, chain },
    }),
    PollingInterval.Slow
  )

  console.log('sparklineQuery', sparklineQuery)

  const sparklinesV2 = useMemo(() => {
    const unwrappedTokens = tokens?.map((token) => {
      unwrapTokenRollux(chainId, token)
    })
    console.log('unwrappedTokens', unwrappedTokens)
    const map: SparklineMap = {}

    // unwrappedTokens?.forEach(
    //   (current) => current?.id && (map[current.id] = current?.market?.priceHistory?.filter(isPricePoint))
    // )
    return map
  }, [chainId, tokens])

  const sparklines = useMemo(() => {
    const unwrappedTokens = sparklineQuery?.topTokens?.map((topToken) => unwrapToken(chainId, topToken))
    const map: SparklineMap = {}
    unwrappedTokens?.forEach(
      (current) => current?.address && (map[current.address] = current?.market?.priceHistory?.filter(isPricePoint))
    )
    return map
  }, [chainId, sparklineQuery?.topTokens])

  const { data, loading: loadingTokens } = usePollQueryWhileMounted(
    useTopTokens100Query({
      variables: { duration, chain },
    }),
    PollingInterval.Fast
  )

  const unwrappedTokens = useMemo(() => data?.topTokens?.map((token) => unwrapToken(chainId, token)), [chainId, data])
  const sortedTokens = useSortedTokens(unwrappedTokens)
  const tokenSortRank = useMemo(
    () =>
      sortedTokens?.reduce((acc, cur, i) => {
        if (!cur.address) return acc
        return {
          ...acc,
          [cur.address]: i + 1,
        }
      }, {}) ?? {},
    [sortedTokens]
  )
  const filteredTokens = useFilteredTokens(sortedTokens)
  return useMemo(
    () => ({ tokens: filteredTokens, tokenSortRank, loadingTokens, sparklines }),
    [filteredTokens, tokenSortRank, loadingTokens, sparklines]
  )
}
