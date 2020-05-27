import { createAction } from '@reduxjs/toolkit'

export interface Call {
  address: string
  calldata: string
}

export function toCallKey(call: Call): string {
  return `${call.address}-${call.calldata}`
}

export const addMulticallListeners = createAction<{ chainId: number; calls: Call[] }>('addMulticallListeners')
export const removeMulticallListeners = createAction<{ chainId: number; calls: Call[] }>('removeMulticallListeners')
export const updateMulticallResults = createAction<{
  chainId: number
  blockNumber: number
  results: {
    [callKey: string]: {
      error: boolean
      data: string | null
    }
  }
}>('updateMulticallResults')
