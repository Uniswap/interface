import { TokenInfo } from '@uniswap/token-lists'

import store from '../state'
import { UNI_EXTENDED_LIST, UNI_LIST, UNSUPPORTED_LIST_URLS } from './lists'
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
  dict: { [key: string]: TOKEN_LIST_TYPES } = {}

  constructor() {
    this.update()
  }

  // TODO(WEB-2488): Index lookups by chainId
  update() {
    // Initialize extended tokens first
    store.getState().lists.byUrl[UNI_EXTENDED_LIST].current?.tokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_EXTENDED
    })

    // Initialize default tokens second, so that any tokens on both default and extended will display as default (no warning)
    store.getState().lists.byUrl[UNI_LIST].current?.tokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_DEFAULT
    })

    // TODO: Figure out if this list is still relevant
    brokenTokenList.tokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BROKEN
    })

    // Initialize blocked tokens from all urls included
    UNSUPPORTED_LIST_URLS.map((url) => store.getState().lists.byUrl[url].current?.tokens)
      .filter((x): x is TokenInfo[] => !!x)
      .flat(1)
      .forEach((token) => {
        this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BLOCKED
      })
  }

  checkToken(address: string) {
    if (address === NATIVE_CHAIN_ID.toLowerCase()) {
      return TOKEN_LIST_TYPES.UNI_DEFAULT
    }
    return this.dict[address] ?? TOKEN_LIST_TYPES.UNKNOWN
  }
}

export default new TokenSafetyLookupTable()
