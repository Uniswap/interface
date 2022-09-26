import { useCombinedTokenMapFromUrls } from 'state/lists/hooks'

import store from '../state'
import { UNI_EXTENDED_LIST, UNI_LIST, UNSUPPORTED_LIST_URLS } from './lists'
import brokenTokenList from './tokenLists/broken.tokenlist.json'

export enum TOKEN_LIST_TYPES {
  UNI_DEFAULT = 1,
  UNI_EXTENDED,
  UNKNOWN,
  BLOCKED,
  BROKEN,
}

class TokenSafetyLookupTable {
  dict: { [key: string]: TOKEN_LIST_TYPES } | null = null

  createMap() {
    const dict: { [key: string]: TOKEN_LIST_TYPES } = {}
    let uniDefaultTokens = store.getState().lists.byUrl[UNI_LIST].current?.tokens
    let uniExtendedTokens = store.getState().lists.byUrl[UNI_EXTENDED_LIST].current?.tokens
    const brokenTokens = brokenTokenList.tokens
    const unsupportTokens = UNSUPPORTED_LIST_URLS.map(
      (url) => store.getState().lists.byUrl[url].current?.tokens
    ).reduce((prev, current) => {
      return prev?.concat()
    }, [])

    if (!uniDefaultTokens) {
      uniDefaultTokens = []
    }
    if (!uniExtendedTokens) {
      uniExtendedTokens = []
    }
    brokenTokens.forEach((token) => {
      dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BROKEN
    })
    unsupportTokens.forEach((token) => {
      dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.BLOCKED
    })
    uniExtendedTokens.forEach((token) => {
      dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_EXTENDED
    })
    uniDefaultTokens.forEach((token) => {
      dict[token.address.toLowerCase()] = TOKEN_LIST_TYPES.UNI_DEFAULT
    })

    return dict
  }

  checkToken(address: string) {
    if (!this.dict) {
      this.dict = this.createMap()
    }
    return this.dict[address] ?? TOKEN_LIST_TYPES.UNKNOWN
  }
}

const NAME_TO_SAFETY_TYPE: { [key: string]: TOKEN_LIST_TYPES } = {
  'Uniswap Labs Default': TOKEN_LIST_TYPES.UNI_DEFAULT,
  'Uniswap Labs Extended': TOKEN_LIST_TYPES.UNI_EXTENDED,
  'Unsupported Tokens': TOKEN_LIST_TYPES.UNI_EXTENDED,
  none: TOKEN_LIST_TYPES.UNKNOWN,
}

export function useTokenSafety(chainId: number, address: string) {
  const tokenMap = useCombinedTokenMapFromUrls([...UNSUPPORTED_LIST_URLS, UNI_LIST, UNI_EXTENDED_LIST])

  const listName = tokenMap[chainId][address].list?.name ?? 'none'
  return NAME_TO_SAFETY_TYPE[listName] ?? TOKEN_LIST_TYPES.UNKNOWN
}

export default new TokenSafetyLookupTable()
