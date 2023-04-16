import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('swap/selectCurrency')
export const switchCurrencies = createAction<void>('swap/switchCurrencies')
export const typeInput = createAction<{ field: Field; typedValue: string }>('swap/typeInput')
export const replaceSwapState = createAction<{
  field: Field
  typedValue: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null
  leverage: boolean
  leverageFactor?: string
  hideClosedLeveragePositions: boolean
  leverageManagerAddress?: string
}>('swap/replaceSwapState')
export const setRecipient = createAction<{ recipient: string | null }>('swap/setRecipient')
export const setLeverageFactor = createAction<{ leverageFactor: string }>('swap/setLeverageFactor')
export const setHideClosedLeveragePositions = createAction<{ hideClosedLeveragePositions: boolean }>('swap/setHideClosedLeveragePositions')
export const setLeverage = createAction<{ leverage: boolean }>('swap/setLeverage')
export const setLeverageManagerAddress = createAction<{ leverageManagerAddress: string }>('swap/setLeverageManagerAddress')
