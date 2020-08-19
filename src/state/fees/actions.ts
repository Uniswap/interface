import { createAction } from '@reduxjs/toolkit'
import { BigintIsh } from 'dxswap-sdk'

export const setSwapFees = createAction<{
  swapFees: {
    [key: string] : {
      fee: bigint,
      owner: string 
    }
  } | {}
}>('setSwapFees')
export const setProtocolFee = createAction<{ protocolFeeDenominator: Number, protocolFeeTo: string }>('setProtocolFee')
