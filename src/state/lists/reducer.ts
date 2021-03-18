import { createReducer } from '@reduxjs/toolkit'
import { getVersionUpgrade, VersionUpgrade } from '@fuseio/token-lists'
import { TokenList } from '@fuseio/token-lists/dist/types'
import {
  BRIDGE_DEFAULT_LIST_OF_LISTS,
  BRIDGE_DEFAULT_TOKEN_LIST_URL,
  SWAP_DEFAULT_LIST_OF_LISTS,
  SWAP_DEFAULT_TOKEN_LIST_URL,
  BRIDGE_LIST_ENV
} from '../../constants/lists'
import { updateVersion } from '../global/actions'
import { acceptListUpdate, addList, fetchTokenList, removeList, selectList } from './actions'
import SWAP_DEFAULT_LIST from '@fuseswap/default-token-list'
import { getBridgeList } from '../../utils'

const BRIDGE_DEFAULT_LIST = getBridgeList(BRIDGE_LIST_ENV)

interface ListState {
  readonly byUrl: {
    readonly [url: string]: {
      readonly current: TokenList | null
      readonly pendingUpdate: TokenList | null
      readonly loadingRequestId: string | null
      readonly error: string | null
    }
  }
  // this contains the default list of lists from the last time the updateVersion was called, i.e. the app was reloaded
  readonly lastInitializedDefaultListOfLists?: string[]
  readonly selectedListUrl: string | undefined
}

export type ListsState = {
  readonly [listType in CurrencyListType]: ListState
}

const NEW_LIST_STATE: ListState['byUrl'][string] = {
  error: null,
  current: null,
  loadingRequestId: null,
  pendingUpdate: null
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P] }

const initialState: ListsState = {
  Swap: {
    lastInitializedDefaultListOfLists: SWAP_DEFAULT_LIST_OF_LISTS,
    byUrl: {
      ...SWAP_DEFAULT_LIST_OF_LISTS.reduce<Mutable<ListState['byUrl']>>((memo, listUrl) => {
        memo[listUrl] = NEW_LIST_STATE
        return memo
      }, {}),
      [SWAP_DEFAULT_TOKEN_LIST_URL]: {
        error: null,
        current: SWAP_DEFAULT_LIST,
        loadingRequestId: null,
        pendingUpdate: null
      }
    },
    selectedListUrl: SWAP_DEFAULT_TOKEN_LIST_URL
  },
  Bridge: {
    lastInitializedDefaultListOfLists: BRIDGE_DEFAULT_LIST_OF_LISTS,
    byUrl: {
      ...BRIDGE_DEFAULT_LIST_OF_LISTS.reduce<Mutable<ListState['byUrl']>>((memo, listUrl) => {
        memo[listUrl] = NEW_LIST_STATE
        return memo
      }, {}),
      [BRIDGE_DEFAULT_TOKEN_LIST_URL]: {
        error: null,
        current: BRIDGE_DEFAULT_LIST,
        loadingRequestId: null,
        pendingUpdate: null
      }
    },
    selectedListUrl: BRIDGE_DEFAULT_TOKEN_LIST_URL
  }
}

export default createReducer(initialState, builder =>
  builder
    .addCase(fetchTokenList.pending, (state, { payload: { requestId, url, listType } }) => {
      state[listType].byUrl[url] = {
        current: null,
        pendingUpdate: null,
        ...state[listType].byUrl[url],
        loadingRequestId: requestId,
        error: null
      }
    })
    .addCase(fetchTokenList.fulfilled, (state, { payload: { requestId, tokenList, url, listType } }) => {
      const current = state[listType].byUrl[url]?.current
      const loadingRequestId = state[listType].byUrl[url]?.loadingRequestId

      // no-op if update does nothing
      if (current) {
        const upgradeType = getVersionUpgrade(current.version, tokenList.version)
        if (upgradeType === VersionUpgrade.NONE) return
        if (loadingRequestId === null || loadingRequestId === requestId) {
          state[listType].byUrl[url] = {
            ...state[listType].byUrl[url],
            loadingRequestId: null,
            error: null,
            current: current,
            pendingUpdate: tokenList
          }
        }
      } else {
        state[listType].byUrl[url] = {
          ...state[listType].byUrl[url],
          loadingRequestId: null,
          error: null,
          current: tokenList,
          pendingUpdate: null
        }
      }
    })
    .addCase(fetchTokenList.rejected, (state, { payload: { url, requestId, errorMessage, listType } }) => {
      if (state[listType].byUrl[url]?.loadingRequestId !== requestId) {
        // no-op since it's not the latest request
        return
      }

      state[listType].byUrl[url] = {
        ...state[listType].byUrl[url],
        loadingRequestId: null,
        error: errorMessage,
        current: null,
        pendingUpdate: null
      }
    })
    .addCase(selectList, (state, { payload: { url, listType } }) => {
      state[listType].selectedListUrl = url
      // automatically adds list
      if (!state[listType].byUrl[url]) {
        state[listType].byUrl[url] = NEW_LIST_STATE
      }
    })
    .addCase(addList, (state, { payload: { url, listType } }) => {
      if (!state[listType].byUrl[url]) {
        state[listType].byUrl[url] = NEW_LIST_STATE
      }
    })
    .addCase(removeList, (state, { payload: { url, listType } }) => {
      if (state[listType].byUrl[url]) {
        delete state[listType].byUrl[url]
      }
      if (state[listType].selectedListUrl === url) {
        state[listType].selectedListUrl = Object.keys(state[listType].byUrl)[0]
      }
    })
    .addCase(acceptListUpdate, (state, { payload: { url, listType } }) => {
      if (!state[listType].byUrl[url]?.pendingUpdate) {
        throw new Error('accept list update called without pending update')
      }
      state[listType].byUrl[url] = {
        ...state[listType].byUrl[url],
        pendingUpdate: null,
        current: state[listType].byUrl[url].pendingUpdate
      }
    })
    .addCase(updateVersion, state => {
      const listTypes: CurrencyListType[] = ['Swap', 'Bridge']
      // state loaded from localStorage, but new lists have never been initialized
      for (const listType of listTypes) {
        if (!state[listType]) {
          state[listType] = initialState[listType]
          continue
        }

        if (!state[listType]?.lastInitializedDefaultListOfLists) {
          state[listType].byUrl = initialState[listType]?.byUrl
          state[listType].selectedListUrl = undefined
        } else if (state[listType].lastInitializedDefaultListOfLists) {
          const lastInitializedSet = state[listType].lastInitializedDefaultListOfLists?.reduce<Set<string>>(
            (s, l) => s.add(l),
            new Set()
          )
          const DEFAULT_LISTS = listType === 'Swap' ? SWAP_DEFAULT_LIST_OF_LISTS : BRIDGE_DEFAULT_LIST_OF_LISTS

          const newListOfListsSet = DEFAULT_LISTS.reduce<Set<string>>((s, l) => s.add(l), new Set())

          DEFAULT_LISTS.forEach(listUrl => {
            if (!lastInitializedSet?.has(listUrl)) {
              state[listType].byUrl[listUrl] = NEW_LIST_STATE
            }
          })

          state[listType].lastInitializedDefaultListOfLists?.forEach(listUrl => {
            if (!newListOfListsSet.has(listUrl)) {
              delete state[listType].byUrl[listUrl]
            }
          })
        }

        state[listType].lastInitializedDefaultListOfLists =
          listType === 'Swap' ? SWAP_DEFAULT_LIST_OF_LISTS : BRIDGE_DEFAULT_LIST_OF_LISTS
      }
    })
)
