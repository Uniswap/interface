import { CustomRankingType, RankingType } from '@universe/api'

export const EXPLORE_ORDER_BYS = [
  RankingType.Volume,
  CustomRankingType.FullyDilutedValuation,
  RankingType.TotalValueLocked,
  CustomRankingType.PricePercentChange1DayDesc,
  CustomRankingType.PricePercentChange1DayAsc,
] as const

export type ExploreOrderBy = (typeof EXPLORE_ORDER_BYS)[number]

export const isSupportedExploreOrderBy = (orderBy: string): orderBy is ExploreOrderBy =>
  (EXPLORE_ORDER_BYS as readonly string[]).includes(orderBy)

export enum TokenMetadataDisplayType {
  Fdv = 0,
  Volume = 1,
  TVL = 2,
  Symbol = 3,
}
