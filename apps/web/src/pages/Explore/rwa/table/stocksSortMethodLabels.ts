import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

const STOCKS_SORT_METHOD_LABEL_KEYS: Record<StocksSortMethod, string> = {
  [StocksSortMethod.MARKET_CAP]: 'stats.marketCap',
  [StocksSortMethod.PRICE]: 'common.price',
  [StocksSortMethod.VOLUME]: 'common.volume',
  [StocksSortMethod.HOUR_CHANGE]: 'common.oneHour.short',
  [StocksSortMethod.DAY_CHANGE]: 'common.oneDay.short',
}

export function getStocksSortMethodLabel({
  t,
  category,
}: {
  t: (key: string) => string
  category: StocksSortMethod
}): string {
  return t(STOCKS_SORT_METHOD_LABEL_KEYS[category])
}
