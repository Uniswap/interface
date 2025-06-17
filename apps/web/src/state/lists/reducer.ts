/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { createReducer } from '@reduxjs/toolkit'
import { getVersionUpgrade, VersionUpgrade } from '@uniswap/token-lists'
import { DEFAULT_INACTIVE_LIST_URLS } from 'constants/lists'
import { updateVersion } from 'state/global/actions'
import { acceptListUpdate, addList, fetchTokenList, removeList } from 'state/lists/actions'
import { ListsState } from 'state/lists/types'
import { Mutable } from 'types/mutable'

type ListState = ListsState['byUrl'][string]

const NEW_LIST_STATE: ListState = {
  error: null,
  current: null,
  loadingRequestId: null,
  pendingUpdate: null,
}

export const initialState: ListsState = {
  lastInitializedDefaultListOfLists: DEFAULT_INACTIVE_LIST_URLS,
  byUrl: {
    ...DEFAULT_INACTIVE_LIST_URLS.reduce<Mutable<ListsState['byUrl']>>((memo, listUrl) => {
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
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!state.byUrl[url]) {
        state.byUrl[url] = NEW_LIST_STATE
      }
    })
    .addCase(removeList, (state, { payload: url }) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
      if (!state.lastInitializedDefaultListOfLists) {
        state.byUrl = initialState.byUrl
      } else {
        const lastInitializedSet = state.lastInitializedDefaultListOfLists.reduce<Set<string>>(
          (s, l) => s.add(l),
          new Set(),
        )
        const newListOfListsSet = DEFAULT_INACTIVE_LIST_URLS.reduce<Set<string>>((s, l) => s.add(l), new Set())

        DEFAULT_INACTIVE_LIST_URLS.forEach((listUrl) => {
          if (!lastInitializedSet.has(listUrl)) {
            state.byUrl[listUrl] = NEW_LIST_STATE
          }
        })

        state.lastInitializedDefaultListOfLists.forEach((listUrl) => {
          if (!newListOfListsSet.has(listUrl)) {
            delete state.byUrl[listUrl]
          }
        })
      }

      state.lastInitializedDefaultListOfLists = DEFAULT_INACTIVE_LIST_URLS
    }),
)
