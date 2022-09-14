import graphql from 'babel-plugin-relay/macro'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuery, useFragment, useLazyLoadQuery, useRelayEnvironment } from 'react-relay'

import { Chain, TokenPriceQuery } from './__generated__/TokenPriceQuery.graphql'
import { TokenPrices$data, TokenPrices$key } from './__generated__/TokenPrices.graphql'
import { TokenQuery } from './__generated__/TokenQuery.graphql'
import {
  HistoryDuration,
  TokenTopProjectsQuery,
  TokenTopProjectsQuery$data,
} from './__generated__/TokenTopProjectsQuery.graphql'

export enum TimePeriod {
  HOUR,
  DAY,
  WEEK,
  MONTH,
  YEAR,
  ALL,
}

function toHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return 'HOUR'
    case TimePeriod.DAY:
      return 'DAY'
    case TimePeriod.WEEK:
      return 'WEEK'
    case TimePeriod.MONTH:
      return 'MONTH'
    case TimePeriod.YEAR:
      return 'YEAR'
    case TimePeriod.ALL:
      return 'MAX'
  }
}

export type PricePoint = { value: number; timestamp: number }

export const projectMetaDataFragment = graphql`
  fragment Token_TokenProject_Metadata on TokenProject {
    description
    homepageUrl
    twitterName
    name
  }
`

const tokenTopProjectsQuery = graphql`
  query TokenTopProjectsQuery($page: Int!, $duration: HistoryDuration!) {
    topTokenProjects(orderBy: MARKET_CAP, pageSize: 20, currency: USD, page: $page) {
      ...Token_TokenProject_Metadata
      name
      tokens {
        name
        chain
        address
        symbol
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
const tokenPricesFragment = graphql`
  fragment TokenPrices on TokenProjectMarket {
    priceHistory(duration: $duration) {
      timestamp
      value
    }
  }
`
type CachedTopToken = NonNullable<NonNullable<TokenTopProjectsQuery$data>['topTokenProjects']>[number]

let cachedTopTokens: Record<string, CachedTopToken> = {}
export function useTopTokenProjectsQuery(page: number, timePeriod: TimePeriod) {
  const topTokens = useLazyLoadQuery<TokenTopProjectsQuery>(tokenTopProjectsQuery, {
    page,
    duration: toHistoryDuration(timePeriod),
  })

  cachedTopTokens =
    topTokens.topTokenProjects?.reduce((acc, current) => {
      const address = current?.tokens?.[0].address
      if (address) acc[address] = current
      return acc
    }, {} as Record<string, CachedTopToken>) ?? {}
  console.log(cachedTopTokens)

  return topTokens
}

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
  const cachedTopToken = cachedTopTokens[address]
  const data = useLazyLoadQuery<TokenQuery>(tokenQuery, {
    contract: { address, chain },
    duration: toHistoryDuration(timePeriod),
    skip: !!cachedTopToken,
  })

  return !cachedTopToken ? data : { tokenProjects: [{ ...cachedTopToken }] }
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

function filterPrices(prices: TokenPrices$data['priceHistory'] | undefined) {
  return prices?.filter((p): p is PricePoint => Boolean(p && p.value))
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

export type TopTokenProject = NonNullable<TokenTopProjectsQuery$data['topTokenProjects']>[number]
export function getDurationDetails(data: TopTokenProject, timePeriod: TimePeriod) {
  let volume = null
  let pricePercentChange = null

  const markets = data?.markets?.[0]
  if (markets) {
    switch (timePeriod) {
      case TimePeriod.HOUR:
        pricePercentChange = null
        break
      case TimePeriod.DAY:
        volume = markets.volume1D?.value
        pricePercentChange = markets.pricePercentChange24h?.value
        break
      case TimePeriod.WEEK:
        volume = markets.volume1W?.value
        pricePercentChange = markets.pricePercentChange1W?.value
        break
      case TimePeriod.MONTH:
        volume = markets.volume1M?.value
        pricePercentChange = markets.pricePercentChange1M?.value
        break
      case TimePeriod.YEAR:
        volume = markets.volume1Y?.value
        pricePercentChange = markets.pricePercentChange1Y?.value
        break
      case TimePeriod.ALL:
        volume = null
        pricePercentChange = null
        break
    }
  }

  return { volume, pricePercentChange }
}
