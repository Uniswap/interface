import { createAction } from '@reduxjs/toolkit'
import { isAddress } from '../../utils'

export interface Call {
  address: string
  callData: string
}

const LOWER_HEX_REGEX = /^0x[a-f0-9]*$/
export function toCallKey(call: Call): string {
  const addr = isAddress(call.address)
  if (!addr) {
    throw new Error(`Invalid address: ${call.address}`)
  }
  if (!LOWER_HEX_REGEX.test(call.callData)) {
    throw new Error(`Invalid hex: ${call.callData}`)
  }
  return `${addr}-${call.callData}`
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

  if (!LOWER_HEX_REGEX.test(pcs[1])) {
    throw new Error(`Invalid hex: ${pcs[1]}`)
  }

  return {
    address: addr,
    callData: pcs[1]
  }
}

export interface ListenerOptions {
  // how often this data should be fetched, by default 1
  readonly blocksPerFetch?: number
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
