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

const initialState: ListsState = {
  byUrl: {
    [DEFAULT_TOKEN_LIST_URL]: {
      error: null,
      current: UNISWAP_DEFAULT_LIST,
      loadingRequestId: null,
      pendingUpdate: null
    }
  },
  selectedListUrl: DEFAULT_TOKEN_LIST_URL
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
    .addCase(selectList, (state, { payload: url }) => {
      const list = state.byUrl[url]
      if (!list || !list.current) return
      state.selectedListUrl = url
    })
    .addCase(addList, (state, { payload: url }) => {
      if (!state.byUrl[url]) {
        state.byUrl[url] = {
          loadingRequestId: null,
          pendingUpdate: null,
          current: null,
          error: null
        }
      }
    })
    .addCase(removeList, (state, { payload: url }) => {
      if (state.byUrl[url]) {
        delete state.byUrl[url]
      }
      if (state.selectedListUrl === url) state.selectedListUrl = undefined
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
    })
)
