import graphql from 'babel-plugin-relay/macro'
import { useFragment, useLazyLoadQuery } from 'react-relay'

import { TokenDetails$data, TokenDetails$key } from './__generated__/TokenDetails.graphql'
import { HistoryDuration, TokenPriceQuery } from './__generated__/TokenPriceQuery.graphql'
import { TokenPrices$data, TokenPrices$key } from './__generated__/TokenPrices.graphql'
import { Chain, TokenQuery } from './__generated__/TokenQuery.graphql'
import { TokenTopQuery, TokenTopQuery$data } from './__generated__/TokenTopQuery.graphql'
import { TimePeriod } from './TopTokenQuery'

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

const tokenQuery = graphql`
  query TokenQuery($contract: ContractInput!, $skip: Boolean = false) {
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
      details: markets(currencies: [USD]) {
        ...TokenDetails
      }
      prices: markets(currencies: [USD]) {
        ...TokenPrices
      }
    }
  }
`

const tokenPriceQuery = graphql`
  query TokenPriceQuery($contract: ContractInput!, $duration: HistoryDuration!, $skip: Boolean = false) {
    tokenProjects(contracts: [$contract]) @skip(if: $skip) {
      markets(currencies: [USD]) {
        priceHistory(duration: $duration) {
          timestamp
          value
        }
      }
    }
  }
`

const topTokensQuery = graphql`
  query TokenTopQuery($page: Int!) {
    topTokenProjects(orderBy: MARKET_CAP, pageSize: 20, currency: USD, page: $page) {
      description
      homepageUrl
      twitterName
      name
      tokens {
        chain
        address
        symbol
      }
      details: markets(currencies: [USD]) {
        ...TokenDetails
      }
      prices: markets(currencies: [USD]) {
        ...TokenPrices
      }
    }
  }
`

export type PricePoint = { value: number; timestamp: number }

let cachedTopTokens: TokenTopQuery$data | null
export function useTopTokenQuery(page: number) {
  const topTokens = useLazyLoadQuery<TokenTopQuery>(topTokensQuery, { page })

  // topTokens.topTokenProjects?.forEach((token) => {
  //   const address = token?.tokens?.[0].address
  //   const chain = token?.tokens?.[0].chain
  //   if (!!token && !!address && !!chain) {
  //     console.log({ data: { tokenProjects: [{ ...token }] } })
  //     cache.set('TokenQuery', { contract: { address, chain } }, { data: { tokenProjects: [{ ...token }] } })
  //   }
  // })
  cachedTopTokens = topTokens

  return topTokens
}

type CachedTopToken = NonNullable<NonNullable<TokenTopQuery$data>['topTokenProjects']>[number]

export function checkCachedTopToken(address: string): CachedTopToken {
  let cachedTokenData: CachedTopToken = null
  if (cachedTopTokens) {
    cachedTopTokens.topTokenProjects?.forEach((token) => {
      if (token?.tokens?.[0].address === address.toLowerCase()) {
        cachedTokenData = token
      }
    })
  }
  return cachedTokenData
}

export function useTokenQuery(address: string, chain: Chain) {
  const cachedTopToken = checkCachedTopToken(address)
  const data = useLazyLoadQuery<TokenQuery>(tokenQuery, { contract: { address, chain }, skip: !!cachedTopToken })

  return !cachedTopToken ? data : { tokenProjects: [{ ...cachedTopToken }] }
}

export function useTokenDetails(data: TokenDetails$key | null | undefined) {
  const tokenDetails = useFragment(tokenDetailsFragment, data ?? null)
  return { tokenDetails }
}

export function useTokenPrices(data: TokenPrices$key | null | undefined) {
  const tokenPrices = useFragment(tokenPricesFragment, data ?? null)
  return { tokenPrices }
}

export function usePrices(
  key: TokenPrices$key | null | undefined,
  address: string,
  chain: Chain,
  timePeriod: TimePeriod
) {
  const { tokenPrices: cachedPriceData } = useTokenPrices(key)
  const cachedPrices = cachedPriceData && getDurationPrices(cachedPriceData, timePeriod)

  const prices = useLazyLoadQuery<TokenPriceQuery>(tokenPriceQuery, {
    contract: { address: address.toLowerCase(), chain },
    duration: toHistoryDuration(timePeriod),
    skip: !!cachedPrices,
  }).tokenProjects?.[0]?.markets?.[0]?.priceHistory?.filter((p): p is PricePoint => Boolean(p && p.value))

  return { prices: cachedPrices ?? prices }
}

export function getDurationPrices(data: TokenPrices$data, timePeriod: TimePeriod) {
  let prices
  switch (timePeriod) {
    case TimePeriod.HOUR:
      prices = data.priceHistory1H
      break
    case TimePeriod.DAY:
      prices = data.priceHistory1D
      break
    case TimePeriod.WEEK:
      prices = data.priceHistory1W
      break
    case TimePeriod.MONTH:
      prices = data.priceHistory1M
      break
    case TimePeriod.YEAR:
      prices = data.priceHistory1Y
      break
    case TimePeriod.ALL:
      prices = data.priceHistoryMAX
      break
  }
  return prices?.filter((p): p is PricePoint => Boolean(p && p.value))
}

export function getDurationDetails(data: TokenDetails$data | null, timePeriod: TimePeriod) {
  let volume = null
  let pricePercentChange = null

  if (data) {
    switch (timePeriod) {
      case TimePeriod.HOUR:
        pricePercentChange = null
        break
      case TimePeriod.DAY:
        volume = data.volume1D?.value
        pricePercentChange = data.pricePercentChange24h?.value
        break
      case TimePeriod.WEEK:
        volume = data.volume1W?.value
        pricePercentChange = data.pricePercentChange1W?.value
        break
      case TimePeriod.MONTH:
        volume = data.volume1M?.value
        pricePercentChange = data.pricePercentChange1M?.value
        break
      case TimePeriod.YEAR:
        volume = data.volume1Y?.value
        pricePercentChange = data.pricePercentChange1Y?.value
        break
      case TimePeriod.ALL:
        volume = null
        pricePercentChange = null
        break
    }
  }

  return { volume, pricePercentChange }
}

const tokenDetailsFragment = graphql`
  fragment TokenDetails on TokenProjectMarket {
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
`

const tokenPricesFragment = graphql`
  fragment TokenPrices on TokenProjectMarket {
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
`
