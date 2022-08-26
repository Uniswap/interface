import graphql from 'babel-plugin-relay/macro'
import { useEffect } from 'react'

// import useInterval from 'lib/hooks/useInterval'
// import ms from 'ms.macro'
// import { useLazyLoadQuery } from 'react-relay'
import type { Chain } from './__generated__/TokenPriceAllQuery.graphql'
import type { HistoryDuration, TokenPriceSingleQuery } from './__generated__/TokenPriceSingleQuery.graphql'
import TokenAPICache from './cache'
import { TimePeriod } from './TopTokenQuery'
import { useDataQueryer } from './useIntervalDataQuery'
//import { PriceHistory } from './types'

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
  const { refreshData, error, isLoading, data } = useDataQueryer<TokenPriceSingleQuery>(query, {
    contract: {
      address,
      chain,
    },
    duration: toHistoryDuration(timePeriod),
  })

  //const [prices, setPrices] = useState({} as Record<TimePeriod, PriceHistory>)

  useEffect(refreshData, [])
  useEffect(refreshData, [timePeriod])

  useEffect(() => {
    if (data) {
      TokenAPICache.setPriceHistory(data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory, address, timePeriod)
    }
  }, [data])

  return { error, isLoading, data: data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory ?? [] }
}

// export function useTokenPriceQuery(address: string, timePeriod: TimePeriod, chain: Chain) {
//   const { refreshData, error, isLoading, data } = useDataQueryer<TokenPriceQueryType>(query, {
//     contract: {
//       address,
//       chain,
//     },
//     duration: toHistoryDuration(timePeriod),
//   })

//   useEffect(() => {
//     const prices = data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory
//     if (prices) {
//       TokenAPICache.setPriceHistory(prices, address, timePeriod)
//     }
//   }, [data])

//   const cachedResult = TokenAPICache.checkPriceHistory(address, timePeriod)
//   if (cachedResult) {
//     return { error: null, isLoading: false, data: cachedResult }
//   } else {
//     refreshData()
//     return { error, isLoading: true, data: data?.tokenProjects?.[0]?.markets?.[0]?.priceHistory ?? [] }
//   }
// }
