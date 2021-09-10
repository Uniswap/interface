import { createAction } from '@reduxjs/toolkit'

export const setSwapFees = createAction<{
  swapFees:
    | {
        [key: string]: {
          fee: bigint
          owner: string
        }
      }
    | {}
}>('setSwapFees')
export const setProtocolFee = createAction<{ protocolFeeDenominator: number; protocolFeeTo: string }>('setProtocolFee')
