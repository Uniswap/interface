import { createAction } from '@reduxjs/toolkit'
import { BigintIsh } from 'dxswap-sdk'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT'
}

export const selectToken = createAction<{ field: Field; address: string }>('selectToken')
export const switchTokens = createAction<void>('switchTokens')
export const typeInput = createAction<{ field: Field; typedValue: string }>('typeInput')
export const replaceSwapState = createAction<{
  field: Field
  typedValue: string
  inputTokenAddress?: string,
  outputTokenAddress?: string,
  swapFees: {
    [key: string] : {
      fee: bigint,
      owner: string 
    }
  } | {},
  protocolFeeDenominator?: Number,
  protocolFeeTo?: string
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
