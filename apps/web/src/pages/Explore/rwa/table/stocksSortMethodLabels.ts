import { useTranslation } from 'react-i18next'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

type StocksSortMethodWithLookupLabel = Exclude<
  StocksSortMethod,
  StocksSortMethod.VOLUME | StocksSortMethod.HOUR_CHANGE | StocksSortMethod.DAY_CHANGE
>

const STOCKS_SORT_METHOD_LABEL_KEYS: Record<StocksSortMethodWithLookupLabel, string> = {
  [StocksSortMethod.FDV]: 'stats.fdv',
  [StocksSortMethod.PRICE]: 'common.price',
}

export function getStocksSortMethodLabel({
  t,
  category,
}: {
  t: (key: string) => string
  category: StocksSortMethod
}): string {
  if (category === StocksSortMethod.VOLUME) {
    return t('common.volume')
  }
  // Keep this literal t() call so i18n extraction preserves common.oneDay.short.
  if (category === StocksSortMethod.DAY_CHANGE) {
    return t('common.oneDay.short')
  }
  // Keep this literal t() call so i18n extraction preserves common.oneHour.short.
  if (category === StocksSortMethod.HOUR_CHANGE) {
    return t('common.oneHour.short')
  }

  return t(STOCKS_SORT_METHOD_LABEL_KEYS[category])
}

export function useStocksSortMethodLabel(category: StocksSortMethod): string {
  const { t } = useTranslation()
  return getStocksSortMethodLabel({ t, category })
}
