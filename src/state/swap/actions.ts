import { createAction } from '@reduxjs/toolkit'
import { SwapTab } from 'components/swap/constants'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('swap/selectCurrency')
export const switchCurrencies = createAction<{ newOutputHasTax: boolean; previouslyEstimatedOutput: string }>(
  'swap/switchCurrencies'
)
export const forceExactInput = createAction<void>('swap/forceExactInput')
export const typeInput = createAction<{ field: Field; typedValue: string }>('swap/typeInput')
export const replaceSwapState = createAction<{
  field: Field
  typedValue: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null
  currentTab: SwapTab
}>('swap/replaceSwapState')
export const setRecipient = createAction<{ recipient: string | null }>('swap/setRecipient')
export const setCurrentTab = createAction<{ tab: SwapTab }>('swap/setCurrentTab')
