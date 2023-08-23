import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit'
import { FarmingType } from 'components/Farm/constants'
import { FarmListInfo } from 'types/farms'

interface Call {
  address: string
  callData: string
  gasRequired?: number
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const LOWER_HEX_REGEX = /^0x[a-f0-9]*$/
export function toCallKey(call: Call): string {
  if (!ADDRESS_REGEX.test(call.address)) {
    throw new Error(`Invalid address: ${call.address}`)
  }
  if (!LOWER_HEX_REGEX.test(call.callData)) {
    throw new Error(`Invalid hex: ${call.callData}`)
  }
  return `${call.address}-${call.callData}`
}

export function parseCallKey(callKey: string): Call {
  const pcs = callKey.split('-')
  if (pcs.length !== 2) {
    throw new Error(`Invalid call key: ${callKey}`)
  }
  return {
    address: pcs[0],
    callData: pcs[1],
  }
}

// export interface ListenerOptions {
//   // how often this data should be fetched, by default 1
//   readonly blocksPerFetch?: number
// }

// export const addMulticallListeners = createAction<{
//   chainId: number
//   calls: Call[]
//   options?: ListenerOptions
// }>('multicall/addMulticallListeners')
// export const removeMulticallListeners = createAction<{
//   chainId: number
//   calls: Call[]
//   options?: ListenerOptions
// }>('multicall/removeMulticallListeners')
// export const fetchingMulticallResults = createAction<{
//   chainId: number
//   calls: Call[]
//   fetchingBlockNumber: number
// }>('multicall/fetchingMulticallResults')
// export const errorFetchingMulticallResults = createAction<{
//   chainId: number
//   calls: Call[]
//   fetchingBlockNumber: number
// }>('multicall/errorFetchingMulticallResults')
// export const updateMulticallResults = createAction<{
//   chainId: number
//   blockNumber: number
//   results: {
//     [callKey: string]: string | null
//   }
// }>('multicall/updateMulticallResults')

export interface V3ListenerOptions {
  // how often this data should be fetched, by default 1
  readonly blocksPerFetch: number
}

export const addV3MulticallListeners = createAction<{
  chainId: number
  calls: Call[]
  options: V3ListenerOptions
}>('multicallV3/addMulticallListeners')
export const removeV3MulticallListeners = createAction<{
  chainId: number
  calls: Call[]
  options: V3ListenerOptions
}>('multicallV3/removeMulticallListeners')
// export const fetchingV3MulticallResults = createAction<{
//   chainId: number
//   calls: Call[]
//   fetchingBlockNumber: number
// }>('multicallV3/fetchingMulticallResults')
// export const errorFetchingV3MulticallResults = createAction<{
//   chainId: number
//   calls: Call[]
//   fetchingBlockNumber: number
// }>('multicallV3/errorFetchingMulticallResults')
// export const updateV3MulticallResults = createAction<{
//   chainId: number
//   blockNumber: number
//   results: {
//     [callKey: string]: string | null
//   }
// }>('multicallV3/updateMulticallResults')

export const updateV3Stake = createAction<{
  txType?: string
  txHash?: string
  txConfirmed?: boolean
  selectedTokenId?: string
  selectedFarmingType?: FarmingType | null
  txError?: string
}>('farms/updateV3Stake')

export const fetchFarmList: Readonly<{
  pending: ActionCreatorWithPayload<{ url: string; requestId: string }>
  fulfilled: ActionCreatorWithPayload<{
    url: string
    farmList: FarmListInfo
    requestId: string
  }>
  rejected: ActionCreatorWithPayload<{
    url: string
    errorMessage: string
    requestId: string
  }>
}> = {
  pending: createAction('lists/fetchFarmList/pending'),
  fulfilled: createAction('lists/fetchFarmList/fulfilled'),
  rejected: createAction('lists/fetchFarmList/rejected'),
}

export const acceptFarmUpdate = createAction<string>('lists/acceptFarmListUpdate')
