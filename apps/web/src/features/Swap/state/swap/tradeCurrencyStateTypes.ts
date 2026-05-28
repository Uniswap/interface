import type { Currency } from '@uniswap/sdk-core'
import { CurrencyField } from 'uniswap/src/types/currency'
import type { RouterPreference } from '~/state/routing/types'

/** Parsed swap/trade URL query params before resolving to `Currency` instances. */
export interface SerializedCurrencyState {
  inputCurrencyAddress?: string
  outputCurrencyAddress?: string
  value?: string
  field?: string
  chainId?: number
  outputChainId?: number
}

/** Shared input/output pair for swap and limit surfaces. */
export interface CurrencyState {
  inputCurrency?: Currency
  outputCurrency?: Currency
}

/** URL-serialized swap form fields (amount, field, routing). */
export interface SwapState {
  readonly independentField: CurrencyField
  readonly typedValue: string
  routerPreferenceOverride?: RouterPreference.API
}
