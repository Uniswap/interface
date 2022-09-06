import { createReducer } from '@reduxjs/toolkit'
import { getVersionUpgrade, TokenList, VersionUpgrade } from '@uniswap/token-lists'

import { DEFAULT_ACTIVE_LIST_URLS } from '../../constants/lists'
import { DEFAULT_LIST_OF_LISTS } from '../../constants/lists'
import { updateVersion } from '../global/actions'
import { acceptListUpdate, addList, disableList, enableList, fetchTokenList, removeList } from './actions'

export interface ListsState {
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

  // currently active lists
  readonly activeListUrls: string[] | undefined
}

type ListState = ListsState['byUrl'][string]

const NEW_LIST_STATE: ListState = {
  error: null,
  current: null,
  loadingRequestId: null,
  pendingUpdate: null,
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] extends ReadonlyArray<infer U> ? U[] : T[P] }

const initialState: ListsState = {
  lastInitializedDefaultListOfLists: DEFAULT_LIST_OF_LISTS,
  byUrl: {
    ...DEFAULT_LIST_OF_LISTS.reduce<Mutable<ListsState['byUrl']>>((memo, listUrl) => {
      memo[listUrl] = NEW_LIST_STATE
      return memo
    }, {}),
  },
  activeListUrls: DEFAULT_ACTIVE_LIST_URLS,
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

        if (upgradeType === VersionUpgrade.NONE) return
        if (loadingRequestId === null || loadingRequestId === requestId) {
          state.byUrl[url] = {
            current,
            pendingUpdate: tokenList,
            loadingRequestId: null,
            error: null,
          }
        }
      } else {
        // activate if on default active
        if (DEFAULT_ACTIVE_LIST_URLS.includes(url)) {
          state.activeListUrls?.push(url)
        }

        if (url === 'https://static.optimism.io/optimism.tokenlist.json') {
          state.byUrl[url] = {
            current: {
              version: {
                major: 1,
                minor: 1,
                patch: 1,
              },
              name: 'Optimism Kovan',
              logoURI: 'https://ethereum-optimism.github.io/optimism.svg',
              keywords: ['scaling', 'layer2', 'infrastructure'],
              timestamp: '2022-08-27T08:03:56.744Z',
              tokens: [
                {
                  chainId: 69,
                  address: '0x6C3D016A3Bd72D49BF1C4bDFe601e2C37700a01A',
                  name: 'Gold',
                  symbol: 'GLD',
                  decimals: 18,
                  logoURI: 'https://static.optimism.io/data/wstETH/logo.svg',
                  extensions: {
                    optimismBridgeAddress: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
                  },
                },
                {
                  chainId: 69,
                  address: '0xE9e84b42E53A8784dF45c761aCE4d1cf4f948Eb3',
                  name: 'Silver',
                  symbol: 'SLVR',
                  decimals: 18,
                  logoURI: 'https://static.optimism.io/data/wstETH/logo.svg',
                  extensions: {
                    optimismBridgeAddress: '0xE9e84b42E53A8784dF45c761aCE4d1cf4f948Eb3',
                  },
                },
              ],
            },
            pendingUpdate: null,
            loadingRequestId: null,
            error: null,
          }
        } else {
          state.byUrl[url] = {
            current: tokenList,
            pendingUpdate: null,
            loadingRequestId: null,
            error: null,
          }
        }
      }
    })
    .addCase(fetchTokenList.rejected, (state, { payload: { url, requestId, errorMessage } }) => {
      if (state.byUrl[url]?.loadingRequestId !== requestId) {
        // no-op since it's not the latest request
        return
      }

      if (url === 'https://static.optimism.io/optimism.tokenlist.json') {
        state.byUrl[url] = {
          current: {
            version: {
              major: 1,
              minor: 1,
              patch: 1,
            },
            name: 'Optimism Kovan',
            logoURI: 'https://ethereum-optimism.github.io/optimism.svg',
            keywords: ['scaling', 'layer2', 'infrastructure'],
            timestamp: '2022-08-27T08:03:56.744Z',
            tokens: [
              {
                chainId: 69,
                address: '0x6C3D016A3Bd72D49BF1C4bDFe601e2C37700a01A',
                name: 'Gold',
                symbol: 'GLD',
                decimals: 18,
                logoURI: 'https://static.optimism.io/data/wstETH/logo.svg',
                extensions: {
                  optimismBridgeAddress: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
                },
              },
              {
                chainId: 69,
                address: '0xE9e84b42E53A8784dF45c761aCE4d1cf4f948Eb3',
                name: 'Silver',
                symbol: 'SLVR',
                decimals: 18,
                logoURI: 'https://static.optimism.io/data/wstETH/logo.svg',
                extensions: {
                  optimismBridgeAddress: '0xE9e84b42E53A8784dF45c761aCE4d1cf4f948Eb3',
                },
              },
            ],
          },
          pendingUpdate: null,
          loadingRequestId: null,
          error: null,
        }
      } else {
        state.byUrl[url] = {
          current: state.byUrl[url].current ? state.byUrl[url].current : null,
          pendingUpdate: null,
          loadingRequestId: null,
          error: errorMessage,
        }
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
      // remove list from active urls if needed
      if (state.activeListUrls && state.activeListUrls.includes(url)) {
        state.activeListUrls = state.activeListUrls.filter((u) => u !== url)
      }
    })
    .addCase(enableList, (state, { payload: url }) => {
      if (!state.byUrl[url]) {
        state.byUrl[url] = NEW_LIST_STATE
      }

      if (state.activeListUrls && !state.activeListUrls.includes(url)) {
        state.activeListUrls.push(url)
      }

      if (!state.activeListUrls) {
        state.activeListUrls = [url]
      }
    })
    .addCase(disableList, (state, { payload: url }) => {
      if (state.activeListUrls && state.activeListUrls.includes(url)) {
        state.activeListUrls = state.activeListUrls.filter((u) => u !== url)
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
        state.activeListUrls = initialState.activeListUrls
      } else if (state.lastInitializedDefaultListOfLists) {
        const lastInitializedSet = state.lastInitializedDefaultListOfLists.reduce<Set<string>>(
          (s, l) => s.add(l),
          new Set()
        )
        const newListOfListsSet = DEFAULT_LIST_OF_LISTS.reduce<Set<string>>((s, l) => s.add(l), new Set())

        DEFAULT_LIST_OF_LISTS.forEach((listUrl) => {
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

      state.lastInitializedDefaultListOfLists = DEFAULT_LIST_OF_LISTS

      // if no active lists, activate defaults
      if (!state.activeListUrls) {
        state.activeListUrls = DEFAULT_ACTIVE_LIST_URLS

        // for each list on default list, initialize if needed
        DEFAULT_ACTIVE_LIST_URLS.map((listUrl: string) => {
          if (!state.byUrl[listUrl]) {
            state.byUrl[listUrl] = NEW_LIST_STATE
          }
          return true
        })
      }
    })
)
