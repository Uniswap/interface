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
    case StocksSortMethod.FDV:
      return t('stats.fdv.description')
    case StocksSortMethod.VOLUME:
      return t('stats.volume.description')
    case StocksSortMethod.HOUR_CHANGE:
    case StocksSortMethod.DAY_CHANGE:
      return undefined
    default:
      return undefined
  }
}
