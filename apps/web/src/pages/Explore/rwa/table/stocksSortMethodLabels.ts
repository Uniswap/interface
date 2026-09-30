import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

type StocksSortMethodWithLookupLabel = Exclude<
  StocksSortMethod,
  StocksSortMethod.VOLUME | StocksSortMethod.HOUR_CHANGE | StocksSortMethod.DAY_CHANGE
>

const STOCKS_SORT_METHOD_LABEL_KEYS: Record<StocksSortMethodWithLookupLabel, string> = {
  [StocksSortMethod.MARKET_CAP]: 'stats.marketCap',
  [StocksSortMethod.PRICE]: 'common.price',
}

export function getStocksSortMethodLabel({
  t,
  category,
  volumeTimeframeSelectable = false,
}: {
  t: (key: string) => string
  category: StocksSortMethod
  /** The volume timeframe selector is shown, so the header leaves the window to it (as the Tokens table does). */
  volumeTimeframeSelectable?: boolean
}): string {
  if (category === StocksSortMethod.VOLUME) {
    return volumeTimeframeSelectable ? t('common.volume') : t('stats.volume.1d.tableHeader')
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
  const volumeTimeframeSelectable = useIsTokenCategoriesEnabled()
  return getStocksSortMethodLabel({ t, category, volumeTimeframeSelectable })
}
