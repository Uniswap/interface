import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'

export type FiatOnRampModalState = {
  prefilledCurrency?: FiatOnRampCurrency
  isOfframp?: boolean
  moonpayOnly?: boolean
  prefilledAmount?: string
  moonpayCurrencyCode?: string
}
