import { CurrencyInfo } from 'wallet/src/features/dataApi/types'

export type FiatOnRampCurrency = {
  currencyInfo: Maybe<CurrencyInfo>
  moonpayCurrencyCode?: string
}

export enum InitialQuoteSelection {
  MostRecent,
  Best,
}
