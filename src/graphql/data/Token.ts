import graphql from 'babel-plugin-relay/macro'
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
  query TokenQuery($contract: ContractInput!, $duration: HistoryDuration!, $skip: Boolean = false) {
    tokenProjects(contracts: [$contract]) @skip(if: $skip) {
      description
      homepageUrl
      twitterName
      name
      tokens {
        chain
        address
        symbol
        market {
          totalValueLocked {
            value
            currency
          }
        }
      }
      prices: markets(currencies: [USD]) {
        ...TokenPrices
      }
      markets(currencies: [USD]) {
        price {
          value
          currency
        }
        marketCap {
          value
          currency
        }
        fullyDilutedMarketCap {
          value
          currency
        }
        volume1D: volume(duration: DAY) {
          value
          currency
        }
        volume1W: volume(duration: WEEK) {
          value
          currency
        }
        volume1M: volume(duration: MONTH) {
          value
          currency
        }
        volume1Y: volume(duration: YEAR) {
          value
          currency
        }
        pricePercentChange24h {
          currency
          value
        }
        pricePercentChange1W: pricePercentChange(duration: WEEK) {
          currency
          value
        }
        pricePercentChange1M: pricePercentChange(duration: MONTH) {
          currency
          value
        }
        pricePercentChange1Y: pricePercentChange(duration: YEAR) {
          currency
          value
        }
        priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
          value
          currency
        }
        priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
          value
          currency
        }
      }
    }
  }
`

export function useTokenQuery(address: string, chain: Chain, timePeriod: TimePeriod) {
  //const cachedTopToken = cachedTopTokens[address]
  const data = useLazyLoadQuery<TokenQuery>(tokenQuery, {
    contract: { address, chain },
    duration: toHistoryDuration(timePeriod),
    skip: false,
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
    $skipMax: Boolean!
  ) {
    tokenProjects(contracts: [$contract]) {
      markets(currencies: [USD]) {
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
        priceHistoryMAX: priceHistory(duration: MAX) @skip(if: $skipMax) {
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

export function useTokenPricesCached(
  priceDataFragmentRef: TokenPrices$key | null | undefined,
  address: string,
  chain: Chain,
  timePeriod: TimePeriod
) {
  // Attempt to use token prices already provided by TokenDetails / TopToken queries
  const environment = useRelayEnvironment()
  const fetchedTokenPrices = useFragment(tokenPricesFragment, priceDataFragmentRef ?? null)?.priceHistory

  const [priceMap, setPriceMap] = useState<Map<TimePeriod, PricePoint[] | undefined>>(
    new Map([[timePeriod, filterPrices(fetchedTokenPrices)]])
  )

  const updatePrices = useCallback(
    (key: TimePeriod, data?: PricePoint[]) => {
      setPriceMap(new Map(priceMap.set(key, data)))
    },
    [priceMap]
  )

  // Fetch the other timePeriods after first render
  useEffect(() => {
    // Fetch all time periods except the one already populated
    fetchQuery<TokenPriceQuery>(environment, tokenPriceQuery, {
      contract: { address, chain },
      skip1H: timePeriod === TimePeriod.HOUR && !!fetchedTokenPrices,
      skip1D: timePeriod === TimePeriod.DAY && !!fetchedTokenPrices,
      skip1W: timePeriod === TimePeriod.WEEK && !!fetchedTokenPrices,
      skip1M: timePeriod === TimePeriod.MONTH && !!fetchedTokenPrices,
      skip1Y: timePeriod === TimePeriod.YEAR && !!fetchedTokenPrices,
      skipMax: timePeriod === TimePeriod.ALL && !!fetchedTokenPrices,
    }).subscribe({
      next: (data) => {
        const markets = data.tokenProjects?.[0]?.markets?.[0]
        if (markets) {
          markets.priceHistory1H && updatePrices(TimePeriod.HOUR, filterPrices(markets.priceHistory1H))
          markets.priceHistory1D && updatePrices(TimePeriod.DAY, filterPrices(markets.priceHistory1D))
          markets.priceHistory1W && updatePrices(TimePeriod.WEEK, filterPrices(markets.priceHistory1W))
          markets.priceHistory1M && updatePrices(TimePeriod.MONTH, filterPrices(markets.priceHistory1M))
          markets.priceHistory1Y && updatePrices(TimePeriod.YEAR, filterPrices(markets.priceHistory1Y))
          markets.priceHistoryMAX && updatePrices(TimePeriod.ALL, filterPrices(markets.priceHistoryMAX))
        }
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { priceMap }
}

export type SingleTokenData = NonNullable<TokenQuery$data['tokenProjects']>[number]
