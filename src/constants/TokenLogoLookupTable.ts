import store from 'state'

import { DEFAULT_LIST_OF_LISTS } from './lists'

class TokenLogoLookupTable {
  private dict: { [key: string]: string[] | undefined } = {}
  private initialized = false

  initialize() {
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
    this.dict = dict
    this.initialized = true
  }
  getIcons(address?: string | null) {
    if (!address) return undefined

    if (!this.initialized) {
      this.initialize()
    }
    return this.dict[address.toLowerCase()]
  }
}

export default new TokenLogoLookupTable()
