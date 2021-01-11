import { createReducer } from '@reduxjs/toolkit'
import { getVersionUpgrade, VersionUpgrade } from '@uniswap/token-lists'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { DEFAULT_LIST_OF_LISTS, DEFAULT_TOKEN_LIST_URL } from '../../constants/lists'
import { updateVersion } from '../global/actions'
import { acceptListUpdate, addList, fetchTokenList, PathNameType, removeList, selectList } from './actions'

export interface ListsState {
  readonly byOsUrl: {
    readonly [pathName: string]: {
      readonly [url: string]: {
        readonly current: TokenList | null
        readonly pendingUpdate: TokenList | null
        readonly loadingRequestId: string | null
        readonly error: string | null
      }
    }
  }

  // this contains the default list of lists from the last time the updateVersion was called, i.e. the app was reloaded
  readonly lastInitializedDefaultOsListOfLists?: { uniswap: string[]; sushiswap: string[] }
  readonly selectedOsListUrl: { uniswap: string; sushiswap: string } | undefined
}

type ListState = ListsState['byOsUrl'][string][string] // ['byOsUrl'][pathName][url]

const NEW_LIST_STATE: ListState = {
  error: null,
  current: null,
  loadingRequestId: null,
  pendingUpdate: null
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P] }

const initialState: ListsState = {
  lastInitializedDefaultOsListOfLists: DEFAULT_LIST_OF_LISTS,
  byOsUrl: {
    uniswap: {
      ...DEFAULT_LIST_OF_LISTS.uniswap.reduce<Mutable<ListsState['byOsUrl']['uniswap']>>((memo, listUrl) => {
        memo[listUrl] = NEW_LIST_STATE
        return memo
      }, {})
    },
    sushiswap: {
      ...DEFAULT_LIST_OF_LISTS.sushiswap.reduce<Mutable<ListsState['byOsUrl']['sushiswap']>>((memo, listUrl) => {
        memo[listUrl] = NEW_LIST_STATE
        return memo
      }, {})
    }
  },
  selectedOsListUrl: DEFAULT_TOKEN_LIST_URL
}

export default createReducer(initialState, builder =>
  builder
    .addCase(fetchTokenList.pending, (state, { payload: { requestId, pathName, url } }) => {
      state.byOsUrl[pathName][url] = {
        current: null,
        pendingUpdate: null,
        ...state.byOsUrl[pathName][url],
        loadingRequestId: requestId,
        error: null
      }
    })
    .addCase(fetchTokenList.fulfilled, (state, { payload: { requestId, tokenList, pathName, url } }) => {
      const current = state.byOsUrl[pathName][url]?.current
      const loadingRequestId = state.byOsUrl[pathName][url]?.loadingRequestId

      // no-op if update does nothing
      if (current) {
        const upgradeType = getVersionUpgrade(current.version, tokenList.version)
        if (upgradeType === VersionUpgrade.NONE) return
        if (loadingRequestId === null || loadingRequestId === requestId) {
          state.byOsUrl[pathName][url] = {
            ...state.byOsUrl[pathName][url],
            loadingRequestId: null,
            error: null,
            current: current,
            pendingUpdate: tokenList
          }
        }
      } else {
        state.byOsUrl[pathName][url] = {
          ...state.byOsUrl[pathName][url],
          loadingRequestId: null,
          error: null,
          current: tokenList,
          pendingUpdate: null
        }
      }
    })
    .addCase(fetchTokenList.rejected, (state, { payload: { url, requestId, pathName, errorMessage } }) => {
      if (state.byOsUrl[pathName][url]?.loadingRequestId !== requestId) {
        // no-op since it's not the latest request
        return
      }

      state.byOsUrl[pathName][url] = {
        ...state.byOsUrl[pathName][url],
        loadingRequestId: null,
        error: errorMessage,
        current: null,
        pendingUpdate: null
      }
    })
    .addCase(selectList, (state, { payload: { pathName, url } }) => {
      if (state.selectedOsListUrl) {
        state.selectedOsListUrl[pathName] = url
      } else {
        if (pathName === 'uniswap') {
          state.selectedOsListUrl = {
            uniswap: url,
            sushiswap: DEFAULT_TOKEN_LIST_URL.sushiswap
          }
        } else {
          state.selectedOsListUrl = {
            uniswap: DEFAULT_TOKEN_LIST_URL.uniswap,
            sushiswap: url
          }
        }
      }

      // state.selectedListUrl?.uniswap = url
      // automatically adds list
      if (!state.byOsUrl[pathName][url]) {
        state.byOsUrl[pathName][url] = NEW_LIST_STATE
      }
    })
    .addCase(addList, (state, { payload: { pathName, url } }) => {
      if (!state.byOsUrl[pathName][url]) {
        state.byOsUrl[pathName][url] = NEW_LIST_STATE
      }
    })
    .addCase(removeList, (state, { payload: { pathName, url } }) => {
      if (state.byOsUrl[pathName][url]) {
        delete state.byOsUrl[pathName][url]
      }
      if (state.selectedOsListUrl?.[pathName] === url) {
        state.selectedOsListUrl[pathName] =
          url === DEFAULT_TOKEN_LIST_URL[pathName]
            ? Object.keys(state.byOsUrl[pathName])[0]
            : DEFAULT_TOKEN_LIST_URL[pathName]
      }
    })
    .addCase(acceptListUpdate, (state, { payload: { pathName, url } }) => {
      if (!state.byOsUrl[pathName][url]?.pendingUpdate) {
        throw new Error('accept list update called without pending update')
      }
      state.byOsUrl[pathName][url] = {
        ...state.byOsUrl[pathName][url],
        pendingUpdate: null,
        current: state.byOsUrl[pathName][url].pendingUpdate
      }
    })
    .addCase(updateVersion, state => {
      // state loaded from localStorage, but new lists have never been initialized
      if (!state.lastInitializedDefaultOsListOfLists) {
        state.byOsUrl = initialState.byOsUrl
        state.selectedOsListUrl = DEFAULT_TOKEN_LIST_URL
      } else if (state.lastInitializedDefaultOsListOfLists) {
        let lastInitializedSet: Set<string> = new Set()
        Object.keys(state.lastInitializedDefaultOsListOfLists).forEach(listKey => {
          const list = state.lastInitializedDefaultOsListOfLists?.[listKey as PathNameType].reduce<Set<string>>(
            (s, l) => s.add(l),
            new Set()
          )
          if (list) {
            lastInitializedSet = new Set([...lastInitializedSet, ...list])
          }
        })

        let newListOfListsSet: Set<string> = new Set()
        Object.keys(DEFAULT_LIST_OF_LISTS).forEach(listKey => {
          const list = DEFAULT_LIST_OF_LISTS?.[listKey as PathNameType].reduce<Set<string>>(
            (s, l) => s.add(l),
            new Set()
          )
          if (list) {
            newListOfListsSet = new Set([...newListOfListsSet, ...list])
          }
        })

        Object.keys(DEFAULT_LIST_OF_LISTS).map(listKey =>
          DEFAULT_LIST_OF_LISTS[listKey as PathNameType].forEach(listUrl => {
            if (!lastInitializedSet.has(listUrl)) {
              state.byOsUrl[listKey][listUrl] = NEW_LIST_STATE
            }
          })
        )

        Object.keys(state.lastInitializedDefaultOsListOfLists).forEach(listKey => {
          state.lastInitializedDefaultOsListOfLists?.[listKey as PathNameType].forEach(listUrl => {
            if (!newListOfListsSet.has(listUrl)) {
              delete state.byOsUrl[listKey][listUrl]
            }
          })
        })
      }

      state.lastInitializedDefaultOsListOfLists = DEFAULT_LIST_OF_LISTS

      if (!state.selectedOsListUrl) {
        state.selectedOsListUrl = DEFAULT_TOKEN_LIST_URL
        if (!state.byOsUrl['uniswap'][DEFAULT_TOKEN_LIST_URL['uniswap']]) {
          state.byOsUrl['uniswap'][DEFAULT_TOKEN_LIST_URL['uniswap']] = NEW_LIST_STATE
        }
        if (!state.byOsUrl['sushiswap'][DEFAULT_TOKEN_LIST_URL['sushiswap']]) {
          state.byOsUrl['sushiswap'][DEFAULT_TOKEN_LIST_URL['sushiswap']] = NEW_LIST_STATE
        }
      }
    })
)
