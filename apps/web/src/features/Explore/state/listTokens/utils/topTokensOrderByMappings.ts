import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { TimePeriod } from '~/appGraphql/data/util'
import { TokenSortMethod } from '~/components/Tokens/constants'

/**
 * Maps TokenSortMethod to (v2) TokensOrderBy for backend list-top-tokens API.
 * PRICE sorting is not supported by the backend; callers omit orderBy for that case.
 * v2 also adds TVL, exposed by no TokenSortMethod today — left unmapped until product decides
 * to surface it as an Explore sort column.
 */
export const tokenSortMethodToOrderBy: Partial<Record<TokenSortMethod, TokensOrderBy>> = {
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: TokensOrderBy.FDV,
  [TokenSortMethod.VOLUME]: TokensOrderBy.VOLUME_1D,
  [TokenSortMethod.HOUR_CHANGE]: TokensOrderBy.PRICE_CHANGE_1H,
  [TokenSortMethod.DAY_CHANGE]: TokensOrderBy.PRICE_CHANGE_1D,
}

/** Maps TimePeriod to volume TokensOrderBy for dynamic volume sorting. */
export const timePeriodToVolumeOrderBy: Record<TimePeriod, TokensOrderBy> = {
  [TimePeriod.HOUR]: TokensOrderBy.VOLUME_1H,
  [TimePeriod.DAY]: TokensOrderBy.VOLUME_1D,
  [TimePeriod.WEEK]: TokensOrderBy.VOLUME_7D,
  [TimePeriod.MONTH]: TokensOrderBy.VOLUME_30D,
  [TimePeriod.YEAR]: TokensOrderBy.VOLUME_1Y,
  [TimePeriod.MAX]: TokensOrderBy.VOLUME_1Y,
}
