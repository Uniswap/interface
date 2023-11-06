import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { MoonpayCurrency } from 'wallet/src/features/fiatOnRamp/types'

export type FiatOnRampCurrency = {
  currencyInfo: Maybe<CurrencyInfo>
  moonpayCurrency: MoonpayCurrency
}
