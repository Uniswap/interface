import { TFunction } from 'i18next'
import { TokenItemData } from 'src/components/explore/TokenItem'
import { LocalTokensOrderBy, RemoteTokensOrderBy, TokensOrderBy } from 'src/features/explore/types'

export function getOrderByValues(orderBy: TokensOrderBy): {
  localOrderBy: LocalTokensOrderBy | undefined
  remoteOrderBy: RemoteTokensOrderBy
} {
  const requiresLocalOrderBy = Object.values<string>(LocalTokensOrderBy).includes(orderBy)

  return {
    localOrderBy: requiresLocalOrderBy ? (orderBy as LocalTokensOrderBy) : undefined,
    remoteOrderBy: requiresLocalOrderBy
      ? RemoteTokensOrderBy.MarketCapDesc // Use remote order by market cap if doing local sort
      : (orderBy as RemoteTokensOrderBy),
  }
}

/**
 * Returns a compare function to sort tokens
 *
 * Market cap and volume use a server-side query and do not require client-side sorting
 */
export function getOrderByCompareFn(orderBy: LocalTokensOrderBy) {
  let compareField: keyof TokenItemData
  let direction = 0

  switch (orderBy) {
    case LocalTokensOrderBy.PriceChangePercentage24hAsc:
      compareField = 'pricePercentChange24h'
      direction = 1
      break
    case LocalTokensOrderBy.PriceChangePercentage24hDesc:
      compareField = 'pricePercentChange24h'
      direction = -1
      break
  }

  return (a: TokenItemData, b: TokenItemData) =>
    Number(a[compareField]) - Number(b[compareField]) > 0 ? direction : -1 * direction
}

export function getOrderByLabel(orderBy: TokensOrderBy, t: TFunction) {
  switch (orderBy) {
    case RemoteTokensOrderBy.MarketCapDesc:
      return t('Market cap')
    case RemoteTokensOrderBy.GlobalVolumeDesc:
      return t('Volume (24h)')
    case LocalTokensOrderBy.PriceChangePercentage24hDesc:
      return t('Percent change (24h) ↑')
    case LocalTokensOrderBy.PriceChangePercentage24hAsc:
      return t('Percent change (24h) ↓')
    default:
      throw new Error('Unexpected order by value ' + orderBy)
  }
}
