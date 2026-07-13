import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

export function getExpandableAssetHeaderDescription({
  t,
  category,
  networkName,
}: {
  t: TFunction
  category: StocksSortMethod
  networkName?: string
}): ReactNode | undefined {
  switch (category) {
    case StocksSortMethod.PRICE:
      return networkName
        ? t('explore.tokens.table.column.price.network.tooltip', { network: networkName })
        : t('explore.tokens.table.column.price.allNetworks.tooltip')
    case StocksSortMethod.MARKET_CAP:
      return t('explore.rwa.table.column.marketCap.tooltip')
    case StocksSortMethod.VOLUME:
      return t('explore.rwa.table.column.volume.tooltip')
    case StocksSortMethod.HOUR_CHANGE:
    case StocksSortMethod.DAY_CHANGE:
      return undefined
    default:
      return undefined
  }
}
