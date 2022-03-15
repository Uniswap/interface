import { createAction } from '@reduxjs/toolkit'

export enum Field {
  TOKEN = 'TOKEN',
  PRICE = 'PRICE',
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('limit/selectCurrency')
export const switchCurrencies = createAction<void>('limit/switchCurrencies')
export const typeInput = createAction<{ field: Field; typedValue: string }>('limit/typeInput')
export const setBuying = createAction<{ buying: boolean }>('limit/setBuying')
export const replaceLimitState = createAction<{
  field: Field
  priceTypedValue: string
  tokenTypedValue: string
  priceCurrencyId?: string
  tokenCurrencyId?: string
  recipient: string | null
  buying: boolean
}>('limit/replaceLimitState')
export const setRecipient = createAction<{ recipient: string | null }>('limit/setRecipient')
