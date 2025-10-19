import { TokenInfo } from '@uniswap/token-lists'
import { ListsState } from 'state/lists/reducer'

import store from '../state'
import { DEFAULT_ACTIVE_LIST_URLS, UNSUPPORTED_LIST_URLS } from './lists'
import { COMMON_BASES } from './routing'
import brokenTokenList from './tokenLists/broken.tokenlist.json'
import { NATIVE_CHAIN_ID } from './tokens'

export enum TOKEN_LIST_TYPES {
  UNI_DEFAULT = 1,
  UNI_EXTENDED,
  UNKNOWN,
  BLOCKED,
  BROKEN,
}

class TokenSafetyLookupTable {
  initialized = false
  dict: { [key: string]: TOKEN_LIST_TYPES } = {}

  // TODO(WEB-2488): Index lookups by chainId
  update(lists: ListsState) {
    this.initialized = true

    // Initialize tokens from active lists as default (trusted)
    DEFAULT_ACTIVE_LIST_URLS.forEach((url) => {
      lists.byUrl[url]?.current?.tokens.forEach((token) => {
        this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_DEFAULT
      })
    })

    // TODO: Figure out if this list is still relevant
    brokenTokenList.tokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BROKEN
    })

    // Initialize blocked tokens from all urls included
    UNSUPPORTED_LIST_URLS.map((url) => lists.byUrl[url]?.current?.tokens)
      .filter((x): x is TokenInfo[] => !!x)
      .flat(1)
      .forEach((token) => {
        this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BLOCKED
      })
  }

  checkToken(address: string, chainId?: number | null) {
    if (!this.initialized) this.update(store.getState().lists)

    if (address === NATIVE_CHAIN_ID.toLowerCase()) {
      return TOKEN_LIST_TYPES.UNI_DEFAULT
    } else if (chainId && COMMON_BASES[chainId]?.some((base) => address === base.wrapped.address.toLowerCase())) {
      return TOKEN_LIST_TYPES.UNI_DEFAULT
    } else {
      return this.dict[address] ?? TOKEN_LIST_TYPES.UNKNOWN
    }
  }
}

export default new TokenSafetyLookupTable()
