import type { Filter } from '@ethersproject/providers'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { filterToKey, Log } from './utils'

export interface LogsState {
  [chainId: number]: {
    [filterKey: string]: {
      listeners: number
      fetchingBlockNumber?: number
      results?:
        | {
            blockNumber: number
            logs: Log[]
            error?: undefined
          }
        | {
            blockNumber: number
            logs?: undefined
            error: true
          }
    }
  }
}

const slice = createSlice({
  name: 'logs',
  initialState: {} as LogsState,
  reducers: {
    addListener(state, { payload: { chainId, filter } }: PayloadAction<{ chainId: number; filter: Filter }>) {
      if (!state[chainId]) state[chainId] = {}
      const key = filterToKey(filter)
      if (!state[chainId][key])
        state[chainId][key] = {
          listeners: 1,
        }
      else state[chainId][key].listeners++
    },
    fetchingLogs(
      state,
      {
        payload: { chainId, filters, blockNumber },
      }: PayloadAction<{ chainId: number; filters: Filter[]; blockNumber: number }>
    ) {
      if (!state[chainId]) return
      for (const filter of filters) {
        const key = filterToKey(filter)
        if (!state[chainId][key]) continue
        state[chainId][key].fetchingBlockNumber = blockNumber
      }
    },
    fetchedLogs(
      state,
      {
        payload: { chainId, filter, results },
      }: PayloadAction<{ chainId: number; filter: Filter; results: { blockNumber: number; logs: Log[] } }>
    ) {
      if (!state[chainId]) return
      const key = filterToKey(filter)
      const fetchState = state[chainId][key]
      if (!fetchState || (fetchState.results && fetchState.results.blockNumber > results.blockNumber)) return
      fetchState.results = results
    },
    fetchedLogsError(
      state,
      {
        payload: { chainId, filter, blockNumber },
      }: PayloadAction<{ chainId: number; blockNumber: number; filter: Filter }>
    ) {
      if (!state[chainId]) return
      const key = filterToKey(filter)
      const fetchState = state[chainId][key]
      if (!fetchState || (fetchState.results && fetchState.results.blockNumber > blockNumber)) return
      fetchState.results = {
        blockNumber,
        error: true,
      }
    },
    removeListener(state, { payload: { chainId, filter } }: PayloadAction<{ chainId: number; filter: Filter }>) {
      if (!state[chainId]) return
      const key = filterToKey(filter)
      if (!state[chainId][key]) return
      state[chainId][key].listeners--
    },
  },
})

export default slice.reducer
export const { addListener, removeListener, fetchedLogs, fetchedLogsError, fetchingLogs } = slice.actions
