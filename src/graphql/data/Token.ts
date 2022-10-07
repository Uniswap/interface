import graphql from 'babel-plugin-relay/macro'
import { useMemo, useState } from 'react'
import { fetchQuery, useLazyLoadQuery } from 'react-relay'

import { Chain, TokenPriceQuery } from './__generated__/TokenPriceQuery.graphql'
import { ContractInput, HistoryDuration, TokenQuery, TokenQuery$data } from './__generated__/TokenQuery.graphql'
import environment from './RelayEnvironment'
import { TimePeriod, toHistoryDuration } from './util'

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
        priceHigh52W: priceHighLow(duration: YEAR, highLow: HIGH) {
          value
        }
        priceLow52W: priceHighLow(duration: YEAR, highLow: LOW) {
          value
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

export type PricePoint = { value: number; timestamp: number }
export function filterPrices(prices: NonNullable<NonNullable<SingleTokenData>['market']>['priceHistory'] | undefined) {
  return prices?.filter((p): p is PricePoint => Boolean(p && p.value))
}

export type PriceDurations = Record<TimePeriod, PricePoint[] | undefined>
function fetchAllPriceDurations(contract: ContractInput, originalDuration: HistoryDuration) {
  return fetchQuery<TokenPriceQuery>(environment, tokenPriceQuery, {
    contract,
    skip1H: originalDuration === 'HOUR',
    skip1D: originalDuration === 'DAY',
    skip1W: originalDuration === 'WEEK',
    skip1M: originalDuration === 'MONTH',
    skip1Y: originalDuration === 'YEAR',
  })
}

export type SingleTokenData = NonNullable<TokenQuery$data['tokens']>[number]
export function useTokenQuery(
  address: string,
  chain: Chain,
  timePeriod: TimePeriod
): [SingleTokenData | undefined, PriceDurations] {
  const [prices, setPrices] = useState<PriceDurations>({
    [TimePeriod.HOUR]: undefined,
    [TimePeriod.DAY]: undefined,
    [TimePeriod.WEEK]: undefined,
    [TimePeriod.MONTH]: undefined,
    [TimePeriod.YEAR]: undefined,
  })

  const contract = useMemo(() => {
    return { address: address.toLowerCase(), chain }
  }, [address, chain])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const originalTimePeriod = useMemo(() => timePeriod, [contract])

  const updatePrices = (response: TokenPriceQuery['response']) => {
    const priceData = response.tokens?.[0]?.market
    if (priceData) {
      setPrices((current) => {
        return {
          [TimePeriod.HOUR]: filterPrices(priceData.priceHistory1H) ?? current[TimePeriod.HOUR],
          [TimePeriod.DAY]: filterPrices(priceData.priceHistory1D) ?? current[TimePeriod.DAY],
          [TimePeriod.WEEK]: filterPrices(priceData.priceHistory1W) ?? current[TimePeriod.WEEK],
          [TimePeriod.MONTH]: filterPrices(priceData.priceHistory1M) ?? current[TimePeriod.MONTH],
          [TimePeriod.YEAR]: filterPrices(priceData.priceHistory1Y) ?? current[TimePeriod.YEAR],
        }
      })
    }
  }

  // Fetch prices & token info in tandem so we can render faster
  useMemo(
    () => fetchAllPriceDurations(contract, toHistoryDuration(originalTimePeriod)).subscribe({ next: updatePrices }),
    [contract, originalTimePeriod]
  )
  const token = useLazyLoadQuery<TokenQuery>(tokenQuery, {
    contract,
    duration: toHistoryDuration(originalTimePeriod),
  }).tokens?.[0]

  useMemo(
    () =>
      setPrices((current) => {
        current[originalTimePeriod] = filterPrices(token?.market?.priceHistory)
        return current
      }),
    [token, originalTimePeriod]
  )

  return [token, prices]
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
