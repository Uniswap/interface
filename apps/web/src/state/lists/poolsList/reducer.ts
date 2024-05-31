import { createReducer } from '@reduxjs/toolkit'
import { getVersionUpgrade, TokenList, VersionUpgrade } from '@uniswap/token-lists'

import { POOLS_LIST } from '../../../constants/lists'
import { updateVersion } from '../../global/actions'
import { acceptListUpdate, addList, fetchTokenList, removeList } from './actions'

// TODO: check unique state
export interface PoolsListsState {
  readonly byUrl: {
    readonly [url: string]: {
      readonly current: TokenList | null
      readonly pendingUpdate: TokenList | null
      readonly loadingRequestId: string | null
      readonly error: string | null
    }
  }
  // this contains the default pools list from the last time the updateVersion was called, i.e. the app was reloaded
  readonly lastInitializedPoolsList?: string[]
}

type PoolsListState = PoolsListsState['byUrl'][string]

const NEW_LIST_STATE: PoolsListState = {
  error: null,
  current: null,
  loadingRequestId: null,
  pendingUpdate: null,
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P] }

const initialState: PoolsListsState = {
  lastInitializedPoolsList: POOLS_LIST,
  byUrl: {
    ...POOLS_LIST.reduce<Mutable<PoolsListsState['byUrl']>>((memo, listUrl) => {
      memo[listUrl] = NEW_LIST_STATE
      return memo
    }, {}),
  },
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(fetchTokenList.pending, (state, { payload: { requestId, url } }) => {
      const current = state.byUrl[url]?.current ?? null
      const pendingUpdate = state.byUrl[url]?.pendingUpdate ?? null

      state.byUrl[url] = {
        current,
        pendingUpdate,
        loadingRequestId: requestId,
        error: null,
      }
    })
    .addCase(fetchTokenList.fulfilled, (state, { payload: { requestId, tokenList, url } }) => {
      const current = state.byUrl[url]?.current
      const loadingRequestId = state.byUrl[url]?.loadingRequestId

      // no-op if update does nothing
      if (current) {
        const upgradeType = getVersionUpgrade(current.version, tokenList.version)

        if (upgradeType === VersionUpgrade.NONE) {
          return
        }
        if (loadingRequestId === null || loadingRequestId === requestId) {
          state.byUrl[url] = {
            current,
            pendingUpdate: tokenList,
            loadingRequestId: null,
            error: null,
          }
        }
      } else {
        state.byUrl[url] = {
          current: tokenList,
          pendingUpdate: null,
          loadingRequestId: null,
          error: null,
        }
      }
    })
    .addCase(fetchTokenList.rejected, (state, { payload: { url, requestId, errorMessage } }) => {
      if (state.byUrl[url]?.loadingRequestId !== requestId) {
        // no-op since it's not the latest request
        return
      }

      state.byUrl[url] = {
        current: state.byUrl[url].current ? state.byUrl[url].current : null,
        pendingUpdate: null,
        loadingRequestId: null,
        error: errorMessage,
      }
    })
    .addCase(addList, (state, { payload: url }) => {
      if (!state.byUrl[url]) {
        state.byUrl[url] = NEW_LIST_STATE
      }
    })
    .addCase(removeList, (state, { payload: url }) => {
      if (state.byUrl[url]) {
        delete state.byUrl[url]
      }
    })
    .addCase(acceptListUpdate, (state, { payload: url }) => {
      if (!state.byUrl[url]?.pendingUpdate) {
        throw new Error('accept list update called without pending update')
      }
      state.byUrl[url] = {
        ...state.byUrl[url],
        current: state.byUrl[url].pendingUpdate,
        pendingUpdate: null,
      }
    })
    .addCase(updateVersion, (state) => {
      // state loaded from localStorage, but new lists have never been initialized
      if (!state.lastInitializedPoolsList) {
        state.byUrl = initialState.byUrl
      } else if (state.lastInitializedPoolsList) {
        const lastInitializedSet = state.lastInitializedPoolsList.reduce<Set<string>>((s, l) => s.add(l), new Set())
        const newListOfListsSet = POOLS_LIST.reduce<Set<string>>((s, l) => s.add(l), new Set())

        POOLS_LIST.forEach((listUrl) => {
          if (!lastInitializedSet.has(listUrl)) {
            state.byUrl[listUrl] = NEW_LIST_STATE
          }
        })

        state.lastInitializedPoolsList.forEach((listUrl) => {
          if (!newListOfListsSet.has(listUrl)) {
            delete state.byUrl[listUrl]
          }
        })
      }

      state.lastInitializedPoolsList = POOLS_LIST
    })
)
