import { createReducer } from '@reduxjs/toolkit'
import { getVersionUpgrade, VersionUpgrade } from '@uniswap/token-lists'
import { TokenList } from '@uniswap/token-lists/dist/types'
import { DEFAULT_TOKEN_LIST_URL } from '../../constants'
import { updateVersion } from '../user/actions'
import { acceptListUpdate, addList, fetchTokenList, removeList, selectList } from './actions'
import UNISWAP_DEFAULT_LIST from '@uniswap/default-token-list'

export interface ListsState {
  readonly byUrl: {
    readonly [url: string]: {
      readonly current: TokenList | null
      readonly pendingUpdate: TokenList | null
      readonly loadingRequestId: string | null
      readonly error: string | null
    }
  }
  readonly selectedListUrl: string | undefined
}

const NEW_LIST_STATE: ListsState['byUrl'][string] = {
  error: null,
  current: null,
  loadingRequestId: null,
  pendingUpdate: null
}

const initialState: ListsState = {
  byUrl: {
    [DEFAULT_TOKEN_LIST_URL]: {
      error: null,
      current: UNISWAP_DEFAULT_LIST,
      loadingRequestId: null,
      pendingUpdate: null
    },
    'https://t2crtokens.eth.link': NEW_LIST_STATE
  },
  selectedListUrl: undefined
}

export default createReducer(initialState, builder =>
  builder
    .addCase(fetchTokenList.pending, (state, { payload: { requestId, url } }) => {
      state.byUrl[url] = {
        current: null,
        pendingUpdate: null,
        ...state.byUrl[url],
        loadingRequestId: requestId,
        error: null
      }
    })
    .addCase(fetchTokenList.fulfilled, (state, { payload: { requestId, tokenList, url } }) => {
      const current = state.byUrl[url]?.current

      // no-op if update does nothing
      if (current) {
        const type = getVersionUpgrade(current.version, tokenList.version)
        if (type === VersionUpgrade.NONE) return
        state.byUrl[url] = {
          ...state.byUrl[url],
          loadingRequestId: null,
          error: null,
          current: current,
          pendingUpdate: tokenList
        }
      } else {
        state.byUrl[url] = {
          ...state.byUrl[url],
          loadingRequestId: null,
          error: null,
          current: tokenList,
          pendingUpdate: null
        }
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
        pendingUpdate: null
      }
    })
    .addCase(selectList, (state, { payload: url }) => {
      state.selectedListUrl = url
      // automatically adds list
      if (!state.byUrl[url]) {
        state.byUrl[url] = NEW_LIST_STATE
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
      if (state.selectedListUrl === url) {
        state.selectedListUrl = Object.keys(state.byUrl)[0]
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
    .addCase(updateVersion, state => {
      delete state.byUrl['https://unpkg.com/@uniswap/default-token-list@latest/uniswap-default.tokenlist.json']
      delete state.byUrl['https://unpkg.com/@uniswap/default-token-list@latest']
      if (state.selectedListUrl && !state.byUrl[state.selectedListUrl]) {
        delete state.selectedListUrl
      }
    })
)
