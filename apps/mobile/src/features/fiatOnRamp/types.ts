import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export type FiatOnRampCurrency = {
  currencyInfo: Maybe<CurrencyInfo>
  moonpayCurrencyCode?: string
  meldCurrencyCode?: string
}

export enum InitialQuoteSelection {
  MostRecent,
  Best,
}
