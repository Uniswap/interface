import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { CustomRankingType, RankingType } from '@universe/api'
import { AppTFunction } from 'ui/src/i18n/types'
import { ExploreOrderBy, TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

export interface V2TokensSort {
  orderBy: TokensOrderBy
  ascending: boolean
}

/**
 * Maps ExploreOrderBy (TokenRankings-era, direction baked into separate enum values for price
 * change) to v2 ListTokens' {orderBy, ascending} shape, which models direction as its own field.
 */
export function exploreOrderByToV2Sort(orderBy: ExploreOrderBy): V2TokensSort {
  switch (orderBy) {
    case RankingType.TotalValueLocked:
      return { orderBy: TokensOrderBy.TVL, ascending: false }
    case RankingType.MarketCap:
      return { orderBy: TokensOrderBy.MARKET_CAP, ascending: false }
    case RankingType.Volume:
      return { orderBy: TokensOrderBy.VOLUME_1D, ascending: false }
    case CustomRankingType.PricePercentChange1DayDesc:
      return { orderBy: TokensOrderBy.PRICE_CHANGE_1D, ascending: false }
    case CustomRankingType.PricePercentChange1DayAsc:
      return { orderBy: TokensOrderBy.PRICE_CHANGE_1D, ascending: true }
    default:
      throw new Error('Unexpected order by value ' + orderBy)
  }
}

export function getTokenMetadataDisplayType(orderBy: ExploreOrderBy): TokenMetadataDisplayType {
  switch (orderBy) {
    case RankingType.MarketCap:
      return TokenMetadataDisplayType.MarketCap
    case RankingType.Volume:
      return TokenMetadataDisplayType.Volume
    case RankingType.TotalValueLocked:
      return TokenMetadataDisplayType.TVL
    case CustomRankingType.PricePercentChange1DayDesc:
    case CustomRankingType.PricePercentChange1DayAsc:
      return TokenMetadataDisplayType.Symbol
    default:
      throw new Error('Unexpected order by value ' + orderBy)
  }
}

// Label shown in the popover context menu.
export function getTokensOrderByMenuLabel(orderBy: ExploreOrderBy, t: AppTFunction): string {
  switch (orderBy) {
    case RankingType.MarketCap:
      return t('explore.tokens.sort.option.marketCap')
    case RankingType.Volume:
      return t('explore.tokens.sort.option.volume')
    case RankingType.TotalValueLocked:
      return t('explore.tokens.sort.option.totalValueLocked')
    case CustomRankingType.PricePercentChange1DayDesc:
      return t('explore.tokens.sort.option.priceIncrease')
    case CustomRankingType.PricePercentChange1DayAsc:
      return t('explore.tokens.sort.option.priceDecrease')
    default:
      throw new Error('Unexpected order by value ' + orderBy)
  }
}

// Label shown when option is selected in dropdown.
export function getTokensOrderBySelectedLabel(orderBy: ExploreOrderBy, t: AppTFunction): string {
  switch (orderBy) {
    case RankingType.MarketCap:
      return t('explore.tokens.sort.label.marketCap')
    case RankingType.Volume:
      return t('explore.tokens.sort.label.volume')
    case RankingType.TotalValueLocked:
      return t('explore.tokens.sort.label.totalValueLocked')
    case CustomRankingType.PricePercentChange1DayDesc:
      return t('explore.tokens.sort.label.priceIncrease')
    case CustomRankingType.PricePercentChange1DayAsc:
      return t('explore.tokens.sort.label.priceDecrease')
    default:
      throw new Error('Unexpected order by value in option text ' + orderBy)
  }
}
