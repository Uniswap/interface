import { CustomRankingType, RankingType } from 'uniswap/src/data/types'

export enum NFTViewType {
  Grid,
  Collection,
}

export type ExploreOrderBy = RankingType | CustomRankingType

export enum TokenMetadataDisplayType {
  MarketCap,
  Volume,
  TVL,
  Symbol,
}

export type DisplayName = {
  name: string
  type: DisplayNameType
}

export enum DisplayNameType {
  Address,
  ENS,
  Local,
  Unitag,
}
