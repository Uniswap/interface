import { TFunction } from 'i18next'
import { ClientSideOrderBy, CoingeckoOrderBy } from 'src/features/explore/types'

export function getOrderByValues(orderBy: CoingeckoOrderBy | ClientSideOrderBy) {
  const requiresRemoteOrderBy = Object.values<string>(CoingeckoOrderBy).includes(orderBy)
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
