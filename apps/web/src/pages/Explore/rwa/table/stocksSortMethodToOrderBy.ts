import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { VolumeOrderBy } from 'uniswap/src/data/apiClients/dataApiService/utils/tokenRankStatsVolume'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

// Typed as a Record so adding a sort method without a ranking fails the build.
const FIXED_ORDER_BY: Record<Exclude<StocksSortMethod, StocksSortMethod.VOLUME>, TokensOrderBy> = {
  [StocksSortMethod.PRICE]: TokensOrderBy.PRICE,
  [StocksSortMethod.HOUR_CHANGE]: TokensOrderBy.PRICE_CHANGE_1H,
  [StocksSortMethod.DAY_CHANGE]: TokensOrderBy.PRICE_CHANGE_1D,
  [StocksSortMethod.MARKET_CAP]: TokensOrderBy.MARKET_CAP,
}

/** Server ranking for a Stocks table sort; the volume column follows the Explore timeframe selector. */
export function stocksSortMethodToOrderBy({
  sortMethod,
  volumeOrderBy,
}: {
  sortMethod: StocksSortMethod
  volumeOrderBy: VolumeOrderBy
}): TokensOrderBy {
  return sortMethod === StocksSortMethod.VOLUME ? volumeOrderBy : FIXED_ORDER_BY[sortMethod]
}
