import { CustomRankingType, RankingType } from '@universe/api'
import { AppTFunction } from 'ui/src/i18n/types'
import { ExploreOrderBy, TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

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
