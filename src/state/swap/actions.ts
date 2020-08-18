import { createAction } from '@reduxjs/toolkit'
import { BigintIsh } from 'dxswap-sdk'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT'
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('selectCurrency')
export const switchCurrencies = createAction<void>('switchCurrencies')
export const typeInput = createAction<{ field: Field; typedValue: string }>('typeInput')
export const replaceSwapState = createAction<{
  field: Field
  typedValue: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null
}>('replaceSwapState')
export const setSwapFees = createAction<{
  swapFees: {
    [key: string] : {
      fee: bigint,
      owner: string 
    }
  } | {}
}>('setSwapFees')
export const setProtocolFee = createAction<{ protocolFeeDenominator: Number, protocolFeeTo: string }>('setProtocolFee')
export const setRecipient = createAction<{ recipient: string | null }>('setRecipient')
