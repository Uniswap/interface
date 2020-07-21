import { createReducer } from '@reduxjs/toolkit'
import { isVersionUpdate } from '@uniswap/token-lists'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { acceptListUpdate, fetchTokenList } from './actions'

export interface ListsState {
  readonly byUrl: {
    readonly [url: string]: {
      readonly current: TokenList | null
      readonly pendingUpdate: TokenList | null
      readonly loadingRequestId: string | null
      readonly error: string | null
    }
  }
}

const initialState: ListsState = {
  byUrl: {}
}

export default createReducer(initialState, builder =>
  builder
    .addCase(fetchTokenList.pending, (state, { meta: { arg: url, requestId } }) => {
      state.byUrl[url] = {
        current: null,
        pendingUpdate: null,
        ...state.byUrl[url],
        loadingRequestId: requestId,
        error: null
      }
    })
    .addCase(fetchTokenList.fulfilled, (state, { payload: tokenList, meta: { arg: url } }) => {
      const current = state.byUrl[url]?.current

      // no-op if update does nothing
      if (current && !isVersionUpdate(current.version, tokenList.version)) {
        return
      }

      state.byUrl[url] = {
        ...state.byUrl[url],
        loadingRequestId: null,
        error: null,
        current: current ?? tokenList,
        pendingUpdate: current ? tokenList : null
      }
    })
    .addCase(fetchTokenList.rejected, (state, { error, meta: { requestId, arg: url } }) => {
      if (state.byUrl[url]?.loadingRequestId !== requestId) {
        // no-op since it's not the latest request
        return
      }

      state.byUrl[url] = {
        ...state.byUrl[url],
        loadingRequestId: null,
        error: error.message ?? 'Unknown error',
        current: null,
        pendingUpdate: null
      }
    })
    .addCase(acceptListUpdate, (state, { payload: url }) => {
      if (!state.byUrl[url]?.pendingUpdate) {
        throw new Error('accept list update called without pending update')
      }
      state.byUrl[url] = {
        ...state.byUrl[url],
        pendingUpdate: null,
        current: state.byUrl[url].pendingUpdate
      }
    })
)
