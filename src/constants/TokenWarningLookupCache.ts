import store from '../state'
import brokenTokenList from './tokenLists/broken.tokenlist.json'
import unsupportedTokenList from './tokenLists/unsupported.tokenlist.json'

export enum TOKEN_LIST_TYPES {
  UNI_DEFAULT,
  UNI_EXTENDED,
  UNKNOWN,
  BLOCKED,
}

class TokenWarningLookupCache {
  dict: { [key: string]: TOKEN_LIST_TYPES } = {}

  uniDefaultTokens = store.getState().lists.byUrl['https://tokens.uniswap.org'].current?.tokens
  brokenTokens = brokenTokenList.tokens
  unsupportTokens = unsupportedTokenList.tokens
  uniExtendedTokens: { address: string }[] = []

  constructor() {
    if (!this.uniDefaultTokens) {
      throw Error('Unable to access default token list')
    }
    this.uniDefaultTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_DEFAULT
    })
    this.brokenTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BLOCKED
    })
    this.unsupportTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BLOCKED
    })
    this.uniExtendedTokens.forEach((token) => {
      this.dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_EXTENDED
    })
  }

  checkToken(address: string) {
    return this.dict[address] ?? TOKEN_LIST_TYPES.UNKNOWN
  }
}

export default new TokenWarningLookupCache()
