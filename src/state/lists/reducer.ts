import { createReducer } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists/dist/types'

import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'

import { fetchTokenList } from './actions'

const KyberTokensList = SUPPORTED_NETWORKS.map(chainId => NETWORKS_INFO[chainId].tokenListUrl)

export interface ListsState {
  readonly byUrl: {
    readonly [url: string]: {
      readonly current: TokenList | null
      readonly loadingRequestId: string | null
      readonly error: string | null
    }
  }
}

type ListState = ListsState['byUrl'][string]

const NEW_LIST_STATE: ListState = {
  error: null,
  current: null,
  loadingRequestId: null,
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P] }

const initialState: ListsState = {
  byUrl: {
    ...KyberTokensList.reduce<Mutable<ListsState['byUrl']>>((memo, listUrl) => {
      memo[listUrl] = { ...NEW_LIST_STATE }
      return memo
    }, {}),
  },
}

export default createReducer(initialState, builder =>
  builder
    .addCase(fetchTokenList.pending, (state, { payload: { requestId, url } }) => {
      state.byUrl[url] = {
        ...state.byUrl[url],
        loadingRequestId: requestId,
        error: null,
      }
    })
    .addCase(fetchTokenList.fulfilled, (state, { payload: { requestId, tokenList, url } }) => {
      state.byUrl[url] = {
        ...state.byUrl[url],
        loadingRequestId: null,
        error: null,
        current: tokenList,
      }
    })
    .addCase(fetchTokenList.rejected, (state, { payload: { url, requestId, errorMessage } }) => {
      if (state.byUrl[url]?.loadingRequestId !== requestId) {
        // no-op since it's not the latest request
        return
      }

      state.byUrl[url] = {
        ...state.byUrl[url],
        loadingRequestId: null,
        error: errorMessage,
        current: null,
      }
    }),
)
