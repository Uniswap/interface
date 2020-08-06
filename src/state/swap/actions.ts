import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT'
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('selectCurrency')
export const switchCurrencies = createAction<void>('switchCurrencies')
export const typeInput = createAction<{ field: Field; typedValue: string }>('typeInput')
export const receiveOutput = createAction<{ outputValue: string }>('receiveOutput')
export const replaceSwapState = createAction<{
  field: Field
  typedValue: string
  inputCurrencyId?: string
  outputCurrencyId?: string
}>('replaceSwapState')
