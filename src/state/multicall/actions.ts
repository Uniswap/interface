import { createAction } from '@reduxjs/toolkit'
import { isAddress } from '../../utils'

export interface Call {
  address: string
  callData: string
}

export function toCallKey(call: Call): string {
  return `${call.address}-${call.callData}`
}

export function parseCallKey(callKey: string): Call {
  const pcs = callKey.split('-')
  if (pcs.length !== 2) {
    throw new Error(`Invalid call key: ${callKey}`)
  }
  const addr = isAddress(pcs[0])
  if (!addr) {
    throw new Error(`Invalid address: ${pcs[0]}`)
  }

  if (!pcs[1].match(/^0x[a-fA-F0-9]*$/)) {
    throw new Error(`Invalid hex: ${pcs[1]}`)
  }

  return {
    address: pcs[0],
    callData: pcs[1]
  }
}

export const addMulticallListeners = createAction<{ chainId: number; calls: Call[] }>('addMulticallListeners')
export const removeMulticallListeners = createAction<{ chainId: number; calls: Call[] }>('removeMulticallListeners')
export const updateMulticallResults = createAction<{
  chainId: number
  blockNumber: number
  results: {
    [callKey: string]: string | null
  }
}>('updateMulticallResults')
