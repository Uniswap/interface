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

interface ListenerOptions {
  // how often this data should be fetched, by default 1
  blocksPerFetch?: number
}

export const addMulticallListeners = createAction<{ chainId: number; calls: Call[]; options?: ListenerOptions }>(
  'addMulticallListeners'
)
export const removeMulticallListeners = createAction<{ chainId: number; calls: Call[]; options?: ListenerOptions }>(
  'removeMulticallListeners'
)
export const fetchingMulticallResults = createAction<{ chainId: number; calls: Call[]; fetchingBlockNumber: number }>(
  'fetchingMulticallResults'
)
export const errorFetchingMulticallResults = createAction<{
  chainId: number
  calls: Call[]
  fetchingBlockNumber: number
}>('errorFetchingMulticallResults')
export const updateMulticallResults = createAction<{
  chainId: number
  blockNumber: number
  results: {
    [callKey: string]: string | null
  }
}>('updateMulticallResults')
