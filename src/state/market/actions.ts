import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('market/selectCurrency')
export const switchCurrencies = createAction<void>('market/switchCurrencies')
export const typeInput = createAction<{ field: Field; typedValue: string }>('market/typeInput')
export const replaceMarketState = createAction<{
  field: Field
  typedValue: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null
}>('market/replaceMarketState')
export const setRecipient = createAction<{ recipient: string | null }>('market/setRecipient')
