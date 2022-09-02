import graphql from 'babel-plugin-relay/macro'
import { useEffect, useState } from 'react'
import { fetchQuery } from 'react-relay'

import type { Chain, TokenPriceAllQuery } from './__generated__/TokenPriceAllQuery.graphql'
import type { HistoryDuration, TokenPriceSingleQuery } from './__generated__/TokenPriceSingleQuery.graphql'
import TokenAPICache from './cache'
import environment from './RelayEnvironment'
import { TimePeriod } from './TopTokenQuery'
import { PriceHistory } from './types'

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

const allQuery = graphql`
  query TokenPriceAllQuery($contract: ContractInput!) {
    tokenProjects(contracts: [$contract]) {
      name
      markets(currencies: [USD]) {
        priceHistory1H: priceHistory(duration: HOUR) {
          timestamp
          value
        }
        priceHistory1D: priceHistory(duration: DAY) {
          timestamp
          value
        }
        priceHistory1W: priceHistory(duration: WEEK) {
          timestamp
          value
        }
        priceHistory1M: priceHistory(duration: MONTH) {
          timestamp
          value
        }
        priceHistory1Y: priceHistory(duration: YEAR) {
          timestamp
          value
        }
        priceHistoryMAX: priceHistory(duration: MAX) {
          timestamp
          value
        }
      }
      tokens {
        chain
        address
        symbol
        decimals
      }
    }
  }
`

const query = graphql`
  query TokenPriceSingleQuery($contract: ContractInput!, $duration: HistoryDuration!) {
    tokenProjects(contracts: [$contract]) {
      name
      markets(currencies: [USD]) {
        priceHistory: priceHistory(duration: $duration) {
          timestamp
          value
        }
      }
      tokens {
        chain
        address
        symbol
        decimals
      }
    }
  }
`

export type PricePoint = { value: number; timestamp: number }

function formatPrices(priceHistory: PriceHistory | undefined) {
  return priceHistory?.filter((p): p is PricePoint => Boolean(p && p.value))
}

function extractPrices(data: TokenPriceSingleQuery['response']) {
  return formatPrices(data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory)
}

export function useTokenPriceQuery(address: string, chain: Chain, timePeriod: TimePeriod) {
  const [prices, setPrices] = useState<PricePoint[] | undefined>(TokenAPICache.checkPriceHistory(address, timePeriod))
  const [error, setError] = useState<any>()
  const [isLoading, setIsLoading] = useState(!prices)

  /* To be called every time the data is successfully queried */
  const updatePrices = (data: TokenPriceSingleQuery['response']) => {
    const priceData = extractPrices(data)
    if (priceData) {
      TokenAPICache.setPriceHistory(priceData, address, timePeriod)
      setPrices(priceData)
    }
  }

  const fetchData = () => {
    fetchQuery<TokenPriceSingleQuery>(environment, query, {
      contract: {
        address,
        chain,
      },
      duration: toHistoryDuration(timePeriod),
    }).subscribe({
      start: () => setIsLoading(true),
      next: updatePrices,
      error: setError,
      complete: () => setIsLoading(false),
    })
  }
  useEffect(() => {
    const cached = TokenAPICache.checkPriceHistory(address, timePeriod)
    if (cached) {
      setPrices(cached)
    } else {
      fetchData()
    }
  }, [address, timePeriod, fetchData])

  return { error, isLoading, prices }
}

export function fillTokenPriceCache(address: string, chain: Chain, timePeriod: TimePeriod) {
  // Load current time period by itself for faster availability
  if (!TokenAPICache.checkPriceHistory(address, timePeriod)) {
    fetchQuery<TokenPriceSingleQuery>(environment, query, {
      contract: {
        address,
        chain,
      },
      duration: toHistoryDuration(timePeriod),
    }).subscribe({
      next: (data) => {
        const prices = formatPrices(data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory)
        prices && TokenAPICache.setPriceHistory(prices, address, timePeriod)
      },
    })
  }

  // Load all time periods in the background
  fetchQuery<TokenPriceAllQuery>(environment, allQuery, {
    contract: {
      address,
      chain,
    },
  }).subscribe({
    next: (data) => {
      const prices1H = formatPrices(data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1H)
      const prices1D = formatPrices(data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1D)
      const prices1W = formatPrices(data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1W)
      const prices1M = formatPrices(data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1M)
      const prices1Y = formatPrices(data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1Y)
      const pricesMax = formatPrices(data?.tokenProjects?.[0]?.markets?.[0]?.priceHistoryMAX)

      prices1H && TokenAPICache.setPriceHistory(prices1H, address, TimePeriod.HOUR)
      prices1D && TokenAPICache.setPriceHistory(prices1D, address, TimePeriod.DAY)
      prices1W && TokenAPICache.setPriceHistory(prices1W, address, TimePeriod.WEEK)
      prices1M && TokenAPICache.setPriceHistory(prices1M, address, TimePeriod.MONTH)
      prices1Y && TokenAPICache.setPriceHistory(prices1Y, address, TimePeriod.YEAR)
      pricesMax && TokenAPICache.setPriceHistory(pricesMax, address, TimePeriod.ALL)
    },
  })
}
