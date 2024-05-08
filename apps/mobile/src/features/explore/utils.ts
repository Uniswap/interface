import { TokenItemData } from 'src/components/explore/TokenItem'
import { AppTFunction } from 'ui/src/i18n/types'
import { TokenSortableField } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  ClientTokensOrderBy,
  TokenMetadataDisplayType,
  TokensOrderBy,
} from 'wallet/src/features/wallet/types'

/**
 * Returns server and client orderBy values to use for topTokens query and client side sorting
 *
 * Uses server side sort by Volume if applying a client side sort after
 * ex. % change sorting use the top 100 tokens by Uniswap Volume, then sorts by % change
 *
 * Note that server side sort by Volume (TokenSortableField.Volume) requires an
 * additional client side sort because there may be a discrepancy in the server's
 * sort by Volume list which is calculated once per 24h and each token's
 * token.market.volume which is updated more frequently
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
    clientOrderBy: requiresClientOrderBy
      ? (orderBy as ClientTokensOrderBy)
      : orderBy === TokenSortableField.Volume
      ? ClientTokensOrderBy.Volume24hDesc
      : undefined,
  }
}

/**
 * Returns a compare function to sort tokens client side.
 */
export function getClientTokensOrderByCompareFn(
  orderBy: ClientTokensOrderBy
): (a: TokenItemData, b: TokenItemData) => number {
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
    case ClientTokensOrderBy.Volume24hDesc:
      compareField = 'volume24h'
      direction = -1
      break
  }

  return (a: TokenItemData, b: TokenItemData) => {
    // undefined values sort to bottom
    if (a[compareField] === undefined) {
      return 1
    }
    if (b[compareField] === undefined) {
      return -1
    }
    return Number(a[compareField]) - Number(b[compareField]) > 0 ? direction : -1 * direction
  }
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

// Label shown in the popover context menu.
export function getTokensOrderByMenuLabel(orderBy: TokensOrderBy, t: AppTFunction): string {
  switch (orderBy) {
    case TokenSortableField.MarketCap:
      return t('explore.tokens.sort.option.marketCap')
    case TokenSortableField.Volume:
      return t('explore.tokens.sort.option.volume')
    case TokenSortableField.TotalValueLocked:
      return t('explore.tokens.sort.option.totalValueLocked')
    case ClientTokensOrderBy.PriceChangePercentage24hDesc:
      return t('explore.tokens.sort.option.priceIncrease')
    case ClientTokensOrderBy.PriceChangePercentage24hAsc:
      return t('explore.tokens.sort.option.priceDecrease')
    default:
      throw new Error('Unexpected order by value ' + orderBy)
  }
}

// Label shown when option is selected in dropdown.
export function getTokensOrderBySelectedLabel(orderBy: TokensOrderBy, t: AppTFunction): string {
  switch (orderBy) {
    case TokenSortableField.MarketCap:
      return t('explore.tokens.sort.label.marketCap')
    case TokenSortableField.Volume:
      return t('explore.tokens.sort.label.volume')
    case TokenSortableField.TotalValueLocked:
      return t('explore.tokens.sort.label.totalValueLocked')
    case ClientTokensOrderBy.PriceChangePercentage24hDesc:
      return t('explore.tokens.sort.label.priceIncrease')
    case ClientTokensOrderBy.PriceChangePercentage24hAsc:
      return t('explore.tokens.sort.label.priceDecrease')
    default:
      throw new Error('Unexpected order by value in option text ' + orderBy)
  }
}
