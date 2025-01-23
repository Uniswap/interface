export enum NFTViewType {
  Grid,
  Collection,
}

/**
 * These types are not currently included in the protbufs generated types. For now will specifiy here
 * and remove when added to protobuf.
 * https://github.com/Uniswap/backend/blob/397033c6c63703f2dddfd5ae4bb95c54ecd0c23b/packages/services/explore/src/model/types.ts#L19-L30
 */
export enum RankingType {
  TotalValueLocked = 'TOTAL_VALUE_LOCKED',
  MarketCap = 'MARKET_CAP',
  Volume = 'VOLUME',
  Popularity = 'POPULARITY',
}

export enum CustomRankingType {
  PricePercentChange1DayAsc = 'PRICE_PERCENT_CHANGE_1_DAY_ASC',
  PricePercentChange1DayDesc = 'PRICE_PERCENT_CHANGE_1_DAY_DESC',
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
