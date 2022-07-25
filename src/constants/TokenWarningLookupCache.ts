import store from '../state'
import { UNI_EXTENDED_LIST, UNI_LIST } from './lists'
import brokenTokenList from './tokenLists/broken.tokenlist.json'
import unsupportedTokenList from './tokenLists/unsupported.tokenlist.json'

export enum TOKEN_LIST_TYPES {
  UNI_DEFAULT,
  UNI_EXTENDED,
  UNKNOWN,
  BLOCKED,
  BROKEN,
}

class TokenWarningLookupCache {
  dict: { [key: string]: TOKEN_LIST_TYPES } = {}

  uniDefaultTokens = store.getState().lists.byUrl[UNI_LIST].current?.tokens
  brokenTokens = brokenTokenList.tokens
  unsupportTokens = unsupportedTokenList.tokens
  uniExtendedTokens = store.getState().lists.byUrl[UNI_EXTENDED_LIST].current?.tokens

  constructor() {
    if (!this.uniDefaultTokens) {
      this.uniDefaultTokens = []
    }
    if (!this.uniExtendedTokens) {
      this.uniExtendedTokens = []
    }

    this.brokenTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BROKEN
    })
    this.unsupportTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BLOCKED
    })
    this.uniExtendedTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_EXTENDED
    })
    this.uniDefaultTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_DEFAULT
    })
  }

  checkToken(address: string) {
    return this.dict[address] ?? TOKEN_LIST_TYPES.UNKNOWN
  }
}

export default new TokenWarningLookupCache()
