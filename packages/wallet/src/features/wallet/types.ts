import { CustomRankingType, RankingType } from 'uniswap/src/data/types'

export enum NFTViewType {
  Grid = 0,
  Collection = 1,
}

export type ExploreOrderBy = RankingType | CustomRankingType

export enum TokenMetadataDisplayType {
  MarketCap = 0,
  Volume = 1,
  TVL = 2,
  Symbol = 3,
}
