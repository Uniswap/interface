import { CustomRankingType, RankingType } from 'uniswap/src/data/types'

export type ExploreOrderBy = RankingType | CustomRankingType

export enum TokenMetadataDisplayType {
  MarketCap = 0,
  Volume = 1,
  TVL = 2,
  Symbol = 3,
}
