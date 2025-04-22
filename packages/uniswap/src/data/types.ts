import { QueryResult } from '@apollo/client'
import { ApolloError } from '@apollo/client/errors'
// Query result does not have a refetch property so add it here in case it needs to get returned
export type GqlResult<T> = Pick<QueryResult<T>, 'data' | 'loading'> &
  Partial<Pick<QueryResult<T>, 'networkStatus'>> & {
    refetch?: () => void // TODO: [MOB-222] figure out the proper type for this from a QueryResult
    error?: ApolloError | Error
  }

export enum SpamCode {
  LOW = 0, // same as isSpam = false on TokenProject
  MEDIUM = 1, // same as isSpam = true on TokenProject
  HIGH = 2, // has a URL in token name
}

/**
 * These Ranking Types are not currently included in the protbufs generated types. For now will specify here
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
  Trending = 'TRENDING',
}
