import { createReducer } from '@reduxjs/toolkit'
import { addMulticallListeners, removeMulticallListeners, toCallKey, updateMulticallResults } from './actions'

interface MulticallState {
  listeners: {
    [chainId: number]: {
      [key: string]: number
    }
  }

  results: {
    [chainId: number]: {
      [key: string]: {
        data: string | null
        error: boolean
        blockNumber: number
      }
    }
  }
}

const initialState: MulticallState = {
  listeners: {},
  results: {}
}

export default createReducer(initialState, builder =>
  builder
    .addCase(addMulticallListeners, (state, { payload: { calls, chainId } }) => {
      state.listeners[chainId] = state.listeners[chainId] ?? {}
      calls.forEach(call => {
        const callKey = toCallKey(call)
        state.listeners[chainId][callKey] = (state.listeners[chainId][callKey] ?? 0) + 1
      })
    })
    .addCase(removeMulticallListeners, (state, { payload: { chainId, calls } }) => {
      if (!state.listeners[chainId]) return
      calls.forEach(call => {
        const callKey = toCallKey(call)
        if (state.listeners[chainId][callKey] === 1) {
          delete state.listeners[chainId][callKey]
        } else {
          state.listeners[chainId][callKey]--
        }
      })
    })
    .addCase(updateMulticallResults, (state, { payload: { chainId, results, blockNumber } }) => {
      state.results[chainId] = state.results[chainId] ?? {}
    })
)
