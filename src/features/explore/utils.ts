import { TFunction } from 'i18next'
import { TokenItemData } from 'src/components/explore/TokenItem'
import { TokenSortableField } from 'src/data/__generated__/types-and-hooks'
import {
  ClientTokensOrderBy,
  TokenMetadataDisplayType,
  TokensOrderBy,
} from 'src/features/explore/types'

/**
 * Returns server and client orderBy values to use for topTokens query and client side sorting
 *
 * Uses server side sort by Volume if applying a client side sort after
 * ex. % change sorting use the top 100 tokens by Uniswap Volume, then sorts by % change
 *
 * @param orderBy currently selected TokensOrderBy value to sort tokens by
 * @returns serverOrderBy to be used in topTokens query, clientOrderBy to be used to determine if client side sort is necessary
 */
export function getTokensOrderByValues(orderBy: TokensOrderBy): {
  serverOrderBy: TokenSortableField
  clientOrderBy: ClientTokensOrderBy | undefined
} {
  const requiresClientOrderBy = Object.values<string>(ClientTokensOrderBy).includes(orderBy)

  return {
    serverOrderBy: requiresClientOrderBy
      ? TokenSortableField.Volume
      : (orderBy as TokenSortableField),
    clientOrderBy: requiresClientOrderBy ? (orderBy as ClientTokensOrderBy) : undefined,
  }
}

/**
 * Returns a compare function to sort tokens client side
 */
export function getClientTokensOrderByCompareFn(orderBy: ClientTokensOrderBy) {
  let compareField: keyof TokenItemData
  let direction = 0

  switch (orderBy) {
    case ClientTokensOrderBy.PriceChangePercentage24hAsc:
      compareField = 'pricePercentChange24h'
      direction = 1
      break
    case ClientTokensOrderBy.PriceChangePercentage24hDesc:
      compareField = 'pricePercentChange24h'
      direction = -1
      break
  }

  return (a: TokenItemData, b: TokenItemData) =>
    Number(a[compareField]) - Number(b[compareField]) > 0 ? direction : -1 * direction
}

export function getTokenMetadataDisplayType(orderBy: TokensOrderBy): TokenMetadataDisplayType {
  switch (orderBy) {
    case TokenSortableField.MarketCap:
      return TokenMetadataDisplayType.MarketCap
    case TokenSortableField.Volume:
      return TokenMetadataDisplayType.Volume
    case TokenSortableField.TotalValueLocked:
      return TokenMetadataDisplayType.TVL
    case ClientTokensOrderBy.PriceChangePercentage24hDesc:
      return TokenMetadataDisplayType.Symbol
    case ClientTokensOrderBy.PriceChangePercentage24hAsc:
      return TokenMetadataDisplayType.Symbol
    default:
      throw new Error('Unexpected order by value ' + orderBy)
  }
}

export function getTokensOrderByLabel(orderBy: TokensOrderBy, t: TFunction) {
  switch (orderBy) {
    case TokenSortableField.MarketCap:
      return t('Market cap')
    case TokenSortableField.Volume:
      return t('Uniswap volume')
    case TokenSortableField.TotalValueLocked:
      return t('Uniswap TVL')
    case ClientTokensOrderBy.PriceChangePercentage24hDesc:
      return t('Price increase')
    case ClientTokensOrderBy.PriceChangePercentage24hAsc:
      return t('Price decrease')
    default:
      throw new Error('Unexpected order by value ' + orderBy)
  }
}
