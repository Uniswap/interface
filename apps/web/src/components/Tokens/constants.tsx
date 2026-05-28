import type { TFunction } from 'i18next'
import { ReactNode } from 'react'

export enum TokenSortMethod {
  FULLY_DILUTED_VALUATION = 'FDV',
  PRICE = 'Price',
  VOLUME = 'Volume',
  HOUR_CHANGE = '1 hour',
  DAY_CHANGE = '1 day',
}

export function getHeaderDescription({
  t,
  category,
  networkName,
}: {
  t: TFunction
  category: TokenSortMethod
  networkName?: string
}): ReactNode | undefined {
  switch (category) {
    case TokenSortMethod.PRICE:
      return networkName
        ? t('explore.tokens.table.column.price.network.tooltip', { network: networkName })
        : t('explore.tokens.table.column.price.allNetworks.tooltip')
    case TokenSortMethod.DAY_CHANGE:
    case TokenSortMethod.HOUR_CHANGE:
      return undefined
    case TokenSortMethod.FULLY_DILUTED_VALUATION:
      return t('stats.fdv.description')
    case TokenSortMethod.VOLUME:
      return t('stats.volume.description')
    default:
      return undefined
  }
}
