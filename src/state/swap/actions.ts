import { createAction } from '@reduxjs/toolkit'

import { FeeConfig } from 'hooks/useSwapV2Callback'
import { Aggregator } from 'utils/aggregator'

import { SolanaEncode } from './types'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('swap/selectCurrency')
export const resetSelectCurrency = createAction<{ field: Field }>('swap/resetSelectCurrency')

export const chooseToSaveGas = createAction<{ saveGas: boolean }>('swap/chooseToSaveGas')
export const switchCurrencies = createAction<void>('swap/switchCurrencies')
export const switchCurrenciesV2 = createAction<void>('swap/switchCurrenciesV2')
export const typeInput = createAction<{ field: Field; typedValue: string }>('swap/typeInput')
export const replaceSwapState = createAction<{
  field: Field
  typedValue?: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null
  feeConfig: FeeConfig | undefined
}>('swap/replaceSwapState')
export const encodedSolana = createAction<{
  encodeSolana: SolanaEncode
}>('swap/encodedSolana')
export const setRecipient = createAction<{ recipient: string | null }>('swap/setRecipient')
export const setFeeConfig = createAction<{ feeConfig: FeeConfig | undefined }>('swap/setFeeConfig')
export const setTrendingSoonShowed = createAction('swap/setTrendingSoonShowed')
export const setTrade = createAction<{ trade: Aggregator | undefined }>('swap/setTrade')
