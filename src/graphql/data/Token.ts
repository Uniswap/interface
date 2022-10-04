import graphql from 'babel-plugin-relay/macro'
import { filterTimeAtom } from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuery, useFragment, useLazyLoadQuery, useRelayEnvironment } from 'react-relay'

import { Chain, TokenPriceQuery } from './__generated__/TokenPriceQuery.graphql'
import { TokenPrices$data, TokenPrices$key } from './__generated__/TokenPrices.graphql'
import { TokenQuery, TokenQuery$data } from './__generated__/TokenQuery.graphql'
import { TimePeriod, toHistoryDuration } from './util'

export type PricePoint = { value: number; timestamp: number }

export const projectMetaDataFragment = graphql`
  fragment Token_TokenProject_Metadata on TokenProject {
    description
    homepageUrl
    twitterName
    name
  }
`
const tokenPricesFragment = graphql`
  fragment TokenPrices on TokenProjectMarket {
    priceHistory(duration: $duration) {
      timestamp
      value
    }
  }
`
/*
The difference between Token and TokenProject:
  Token: an on-chain entity referring to a contract (e.g. uni token on ethereum 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984)
  TokenProject: an off-chain, aggregated entity that consists of a token and its bridged tokens (e.g. uni token on all chains)
  TokenMarket and TokenProjectMarket then are market data entities for the above.
    TokenMarket is per-chain market data for contracts pulled from the graph.
    TokenProjectMarket is aggregated market data (aggregated over multiple dexes and centralized exchanges) that we get from coingecko.
*/
const tokenQuery = graphql`
  query TokenQuery($contract: ContractInput!, $duration: HistoryDuration!) {
    tokens(contracts: [$contract]) {
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
        priceHistory(duration: $duration) {
          timestamp
          value
        }
        price {
          value
          currency
        }
        volume24H: volume(duration: DAY) {
          value
          currency
        }
      }
      project {
        description
        homepageUrl
        twitterName
        logoUrl
        tokens {
          chain
          address
        }
      }
    }
  }
`

export function useTokenQuery(address: string, chain: Chain, timePeriod: TimePeriod) {
  const data = useLazyLoadQuery<TokenQuery>(tokenQuery, {
    contract: { address: address.toLowerCase(), chain },
    duration: toHistoryDuration(timePeriod),
  })

  return data
}

const tokenPriceQuery = graphql`
  query TokenPriceQuery(
    $contract: ContractInput!
    $skip1H: Boolean!
    $skip1D: Boolean!
    $skip1W: Boolean!
    $skip1M: Boolean!
    $skip1Y: Boolean!
  ) {
    tokens(contracts: [$contract]) {
      market(currency: USD) {
        priceHistory1H: priceHistory(duration: HOUR) @skip(if: $skip1H) {
          timestamp
          value
        }
        priceHistory1D: priceHistory(duration: DAY) @skip(if: $skip1D) {
          timestamp
          value
        }
        priceHistory1W: priceHistory(duration: WEEK) @skip(if: $skip1W) {
          timestamp
          value
        }
        priceHistory1M: priceHistory(duration: MONTH) @skip(if: $skip1M) {
          timestamp
          value
        }
        priceHistory1Y: priceHistory(duration: YEAR) @skip(if: $skip1Y) {
          timestamp
          value
        }
      }
    }
  }
`

export function filterPrices(prices: TokenPrices$data['priceHistory'] | undefined) {
  return prices?.filter((p): p is PricePoint => Boolean(p && p.value))
}

export function useTokenPricesFromFragment(key: TokenPrices$key | null | undefined) {
  const fetchedTokenPrices = useFragment(tokenPricesFragment, key ?? null)?.priceHistory
  return filterPrices(fetchedTokenPrices)
}

export function useTokenPricesCached(token: SingleTokenData) {
  // Attempt to use token prices already provided by TokenDetails / TopToken queries
  const environment = useRelayEnvironment()
  const timePeriod = useAtomValue(filterTimeAtom)

  const [priceMap, setPriceMap] = useState<Map<TimePeriod, PricePoint[] | undefined>>(new Map())

  const updatePrices = useCallback(
    (key: TimePeriod, data?: PricePoint[]) => {
      setPriceMap(new Map(priceMap.set(key, data)))
    },
    [priceMap]
  )

  // Fetch the other timePeriods after first render
  useEffect(() => {
    const fetchedTokenPrices = token?.market?.priceHistory
    updatePrices(timePeriod, filterPrices(fetchedTokenPrices))
    // Fetch all time periods except the one already populated
    if (token?.chain && token?.address) {
      fetchQuery<TokenPriceQuery>(environment, tokenPriceQuery, {
        contract: { address: token.address, chain: token.chain },
        skip1H: timePeriod === TimePeriod.HOUR && !!fetchedTokenPrices,
        skip1D: timePeriod === TimePeriod.DAY && !!fetchedTokenPrices,
        skip1W: timePeriod === TimePeriod.WEEK && !!fetchedTokenPrices,
        skip1M: timePeriod === TimePeriod.MONTH && !!fetchedTokenPrices,
        skip1Y: timePeriod === TimePeriod.YEAR && !!fetchedTokenPrices,
      }).subscribe({
        next: (data) => {
          const market = data.tokens?.[0]?.market
          if (market) {
            market.priceHistory1H && updatePrices(TimePeriod.HOUR, filterPrices(market.priceHistory1H))
            market.priceHistory1D && updatePrices(TimePeriod.DAY, filterPrices(market.priceHistory1D))
            market.priceHistory1W && updatePrices(TimePeriod.WEEK, filterPrices(market.priceHistory1W))
            market.priceHistory1M && updatePrices(TimePeriod.MONTH, filterPrices(market.priceHistory1M))
            market.priceHistory1Y && updatePrices(TimePeriod.YEAR, filterPrices(market.priceHistory1Y))
          }
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token?.chain, token?.address])

  return { prices: priceMap.get(timePeriod) }
}

export type SingleTokenData = NonNullable<TokenQuery$data['tokens']>[number]
