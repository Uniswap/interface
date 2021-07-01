import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { EventFilter, filterToKey, Log } from './utils'

export interface LogsState {
  [chainId: number]: {
    [filterKey: string]: {
      listeners: number
      fetchingBlockNumber?: number
      results?: {
        blockNumber: number
        logs: Log[]
      }
    }
  }
}

const slice = createSlice({
  name: 'logs',
  initialState: {} as LogsState,
  reducers: {
    addListener(state, { payload: { chainId, filter } }: PayloadAction<{ chainId: number; filter: EventFilter }>) {
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
      }: PayloadAction<{ chainId: number; filters: EventFilter[]; blockNumber: number }>
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
      }: PayloadAction<{ chainId: number; filter: EventFilter; results: { blockNumber: number; logs: Log[] } }>
    ) {
      if (!state[chainId]) return
      const key = filterToKey(filter)
      if (!state[chainId][key]) return
      state[chainId][key].results = results
    },
    removeListener(state, { payload: { chainId, filter } }: PayloadAction<{ chainId: number; filter: EventFilter }>) {
      if (!state[chainId]) return
      const key = filterToKey(filter)
      if (!state[chainId][key]) return
      else if (--state[chainId][key].listeners === 0) {
        delete state[chainId][key]
      }
    },
  },
})

export default slice.reducer
export const { addListener, removeListener, fetchedLogs, fetchingLogs } = slice.actions
