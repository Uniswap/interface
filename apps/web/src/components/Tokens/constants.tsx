import { ReactNode } from 'react'
import { Trans } from 'react-i18next'

export enum TokenSortMethod {
  FULLY_DILUTED_VALUATION = 'FDV',
  PRICE = 'Price',
  VOLUME = 'Volume',
  HOUR_CHANGE = '1 hour',
  DAY_CHANGE = '1 day',
}

export const HEADER_DESCRIPTIONS: Record<TokenSortMethod, ReactNode | undefined> = {
  [TokenSortMethod.PRICE]: undefined,
  [TokenSortMethod.DAY_CHANGE]: undefined,
  [TokenSortMethod.HOUR_CHANGE]: undefined,
  [TokenSortMethod.FULLY_DILUTED_VALUATION]: <Trans i18nKey="stats.fdv.description" />,
  [TokenSortMethod.VOLUME]: <Trans i18nKey="stats.volume.description" />,
}
