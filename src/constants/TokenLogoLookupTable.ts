import store from 'state'

import { DEFAULT_LIST_OF_LISTS } from './lists'

class TokenLogoLookupTable {
  dict: { [key: string]: string[] | undefined } | null = null

  createMap() {
    const dict: { [key: string]: string[] | undefined } = {}

    DEFAULT_LIST_OF_LISTS.forEach((list) =>
      store.getState().lists.byUrl[list].current?.tokens.forEach((token) => {
        if (token.logoURI) {
          const lowercaseAddress = token.address.toLowerCase()
          const currentEntry = dict[lowercaseAddress]
          if (currentEntry) {
            currentEntry.push(token.logoURI)
          } else {
            dict[lowercaseAddress] = [token.logoURI]
          }
        }
      })
    )
    return dict
  }
  getIcons(address?: string | null) {
    if (!address) return undefined

    if (!this.dict) {
      this.dict = this.createMap()
    }
    return this.dict[address.toLowerCase()]
  }
}

export default new TokenLogoLookupTable()
export const BAD_SRCS: { [tokenAddress: string]: true } = {}
