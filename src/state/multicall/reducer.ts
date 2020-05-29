import { createReducer } from '@reduxjs/toolkit'
import { addMulticallListeners, removeMulticallListeners, toCallKey, updateMulticallResults } from './actions'

interface MulticallState {
  callListeners: {
    [chainId: number]: {
      [callKey: string]: number
    }
  }

  callResults: {
    [chainId: number]: {
      [callKey: string]: {
        data: string | null
        blockNumber: number
      }
    }
  }
}

const initialState: MulticallState = {
  callListeners: {},
  callResults: {}
}

export default createReducer(initialState, builder =>
  builder
    .addCase(addMulticallListeners, (state, { payload: { calls, chainId } }) => {
      state.callListeners[chainId] = state.callListeners[chainId] ?? {}
      calls.forEach(call => {
        const callKey = toCallKey(call)
        state.callListeners[chainId][callKey] = (state.callListeners[chainId][callKey] ?? 0) + 1
      })
    })
    .addCase(removeMulticallListeners, (state, { payload: { chainId, calls } }) => {
      if (!state.callListeners[chainId]) return
      calls.forEach(call => {
        const callKey = toCallKey(call)
        if (state.callListeners[chainId][callKey] === 1) {
          delete state.callListeners[chainId][callKey]
        } else {
          state.callListeners[chainId][callKey]--
        }
      })
    })
    .addCase(updateMulticallResults, (state, { payload: { chainId, results, blockNumber } }) => {
      state.callResults[chainId] = state.callResults[chainId] ?? {}
      Object.keys(results).forEach(callKey => {
        const current = state.callResults[chainId][callKey]
        if (current && current.blockNumber > blockNumber) return
        state.callResults[chainId][callKey] = {
          data: results[callKey],
          blockNumber
        }
      })
    })
)
