import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@uniswap/sdk'

export enum Field {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  LIQUIDITY = 'LIQUIDITY',
  TOKEN_A = 'TOKEN_A',
  TOKEN_B = 'TOKEN_B'
}

export const typeInput = createAction<{ field: Field; typedValue: string }>('typeInputBurn')
export const setBurnDefaultsFromURLMatchParams = createAction<{
  chainId: ChainId
  params: { tokens: string }
}>('setBurnDefaultsFromURLMatchParams')
