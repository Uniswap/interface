import { createAction } from '@reduxjs/toolkit'

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
  inputTokenAddress?: string
  outputTokenAddress?: string,
  protocolFeeDenominator?: number,
  swapFees?: { [key: string] : number }
}>('replaceSwapState')
export const setSwapFee = createAction<{ pairAddress: string; swapFee: number }>('setSwapFee')
export const setProtocolFeeDenominator = createAction<{ protocolFeeDenominator: number }>('setProtocolFeeDenominator')
