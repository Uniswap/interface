import { TFunction } from 'i18next'
import {
  ClientSideOrderBy,
  CoingeckoMarketCoin,
  CoingeckoOrderBy,
} from 'src/features/dataApi/coingecko/types'

/**
 * Returns a compare function to sort market tokens
 *
 * Market cap and volume use a server-side query and do not require client-side sorting
 */
export function getCompareFn(order: ClientSideOrderBy) {
  let compareField: keyof CoingeckoMarketCoin
  let direction = 0

  switch (order) {
    case ClientSideOrderBy.PriceChangePercentage24hAsc:
      compareField = 'price_change_percentage_24h'
      direction = 1
      break
    case ClientSideOrderBy.PriceChangePercentage24hDesc:
      compareField = 'price_change_percentage_24h'
      direction = -1
      break
  }

  return (a: CoingeckoMarketCoin, b: CoingeckoMarketCoin) =>
    Number(a[compareField]) - Number(b[compareField]) > 0 ? direction : -1 * direction
}

export function getOrderByValues(orderBy: CoingeckoOrderBy | ClientSideOrderBy) {
  const requiresRemoteOrderBy = Object.values<string>(orderBy).includes(orderBy)

  return {
    localOrderBy: !requiresRemoteOrderBy ? (orderBy as ClientSideOrderBy) : undefined,
    remoteOrderBy: requiresRemoteOrderBy ? (orderBy as CoingeckoOrderBy) : undefined,
  }
}

export function getOrderByLabel(orderBy: CoingeckoOrderBy | ClientSideOrderBy, t: TFunction) {
  if (!orderBy) return ''

  switch (orderBy) {
    case CoingeckoOrderBy.MarketCapDesc:
      return t('Market cap')
    case CoingeckoOrderBy.VolumeDesc:
      return t('Volume (24h)')
    case ClientSideOrderBy.PriceChangePercentage24hDesc:
      return t('Percent change (24h) ↑')
    case ClientSideOrderBy.PriceChangePercentage24hAsc:
      return t('Percent change (24h) ↓')
    default:
      throw new Error('Unexpected order by value ' + orderBy)
  }
}
