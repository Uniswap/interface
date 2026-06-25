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

/** URL-serialized swap form fields (amount, field, routing). */
export interface SwapState {
  readonly independentField: CurrencyField
  readonly typedValue: string
  routerPreferenceOverride?: RouterPreference.API
}
