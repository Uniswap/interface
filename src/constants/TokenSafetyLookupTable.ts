import store from '../state'
import { UNI_EXTENDED_LIST, UNI_LIST } from './lists'
import brokenTokenList from './tokenLists/broken.tokenlist.json'
import unsupportedTokenList from './tokenLists/unsupported.tokenlist.json'

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
    let uniDefaultTokens = store.getState().lists.byUrl[UNI_LIST].current?.tokens
    let uniExtendedTokens = store.getState().lists.byUrl[UNI_EXTENDED_LIST].current?.tokens
    const brokenTokens = brokenTokenList.tokens
    const unsupportTokens = unsupportedTokenList.tokens

    if (!uniDefaultTokens) {
      uniDefaultTokens = []
    }
    if (!uniExtendedTokens) {
      uniExtendedTokens = []
    }

    brokenTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BROKEN
    })
    unsupportTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BLOCKED
    })
    uniExtendedTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_EXTENDED
    })
    uniDefaultTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_DEFAULT
    })
    console.log('YO')
  }

  checkToken(address: string) {
    console.log('What')
    return this.dict[address] ?? TOKEN_LIST_TYPES.UNKNOWN
  }
}

export default new TokenSafetyLookupTable()
