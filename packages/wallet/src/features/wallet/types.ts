import { CustomRankingType, RankingType } from '@universe/api'

export type ExploreOrderBy = RankingType | Exclude<CustomRankingType, CustomRankingType.Trending>

export const isSupportedExploreOrderBy = (orderBy: string): orderBy is ExploreOrderBy => {
  return (
    Object.values(RankingType).includes(orderBy as RankingType) ||
    (Object.values(CustomRankingType).includes(orderBy as CustomRankingType) && orderBy !== CustomRankingType.Trending)
  )
}

export enum TokenMetadataDisplayType {
  MarketCap = 0,
  Volume = 1,
  TVL = 2,
  Symbol = 3,
}
