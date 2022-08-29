import graphql from 'babel-plugin-relay/macro'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuery } from 'react-relay'

import type { Chain, TokenPriceAllQuery } from './__generated__/TokenPriceAllQuery.graphql'
import type { HistoryDuration, TokenPriceSingleQuery } from './__generated__/TokenPriceSingleQuery.graphql'
import TokenAPICache from './cache'
import environment from './RelayEnvironment'
import { TimePeriod } from './TopTokenQuery'
import { PriceHistory } from './types'
import { useRefreshableQuery } from './useRefreshableQuery'

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

export function useTokenPriceQuery(address: string, timePeriod: TimePeriod, chain: Chain) {
  const [prices, setPrices] = useState<PriceHistory>(TokenAPICache.checkPriceHistory(address, timePeriod))
  const [error, setError] = useState<any>()
  const [isLoading, setIsLoading] = useState(!prices)

  /* To be called every time the data is successfully queried */
  const updatePrices = useCallback(
    (data: TokenPriceSingleQuery['response']) => {
      const newPrices = data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory
      if (newPrices) {
        TokenAPICache.setPriceHistory(newPrices, address, timePeriod)
        setPrices(newPrices)
      }
    },
    [timePeriod, address]
  )

  const fetchPrices = useRefreshableQuery<TokenPriceSingleQuery>(
    query,
    {
      contract: {
        address,
        chain,
      },
      duration: toHistoryDuration(timePeriod),
    },
    updatePrices,
    setError,
    setIsLoading
  )

  /* To be called on first load, or when time period changes */
  const getData = useCallback(() => {
    const cached = TokenAPICache.checkPriceHistory(address, timePeriod)
    if (cached) {
      setPrices(cached)
      setIsLoading(false)
    } else {
      setIsLoading(true)
      fetchPrices()
    }
  }, [timePeriod])

  useEffect(() => {
    if (!prices) {
      getData()
    }
  }, [])
  useEffect(getData, [timePeriod])

  return { error, isLoading, data: prices ?? [] }
}

export function fillTokenPriceCache(address: string, chain: Chain) {
  fetchQuery<TokenPriceAllQuery>(environment, allQuery, {
    contract: {
      address,
      chain,
    },
  }).subscribe({
    next: (data) => {
      const prices1H = data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1H
      const prices1D = data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1D
      const prices1W = data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1W
      const prices1M = data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1M
      const prices1Y = data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory1Y
      const pricesMax = data?.tokenProjects?.[0]?.markets?.[0]?.priceHistoryMAX

      if (prices1H) {
        TokenAPICache.setPriceHistory(prices1H, address, TimePeriod.HOUR)
      }
      if (prices1D) {
        TokenAPICache.setPriceHistory(prices1D, address, TimePeriod.DAY)
      }
      if (prices1W) {
        TokenAPICache.setPriceHistory(prices1W, address, TimePeriod.WEEK)
      }
      if (prices1M) {
        TokenAPICache.setPriceHistory(prices1M, address, TimePeriod.MONTH)
      }
      if (prices1Y) {
        TokenAPICache.setPriceHistory(prices1Y, address, TimePeriod.YEAR)
      }
      if (pricesMax) {
        TokenAPICache.setPriceHistory(pricesMax, address, TimePeriod.ALL)
      }
    },
  })
}
