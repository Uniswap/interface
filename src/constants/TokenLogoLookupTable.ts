import store from '../state'
import { DEFAULT_LIST_OF_LISTS } from './lists'

class TokenLogoLookupTable {
  dict: { [key: string]: string | undefined } | null = null

  createMap() {
    const dict: { [key: string]: string | undefined } = {}

    const lists = DEFAULT_LIST_OF_LISTS
    lists.forEach((list) =>
      store.getState().lists.byUrl[list].current?.tokens.forEach((token) => {
        const lowercaseAddress = token.address.toLowerCase()
        const currentEntry = dict[lowercaseAddress]
        // Prefer non-coingecko (lower res) logos
        if (!currentEntry || currentEntry.startsWith('https://assets.coingecko')) {
          dict[lowercaseAddress] = token.logoURI
        }
      })
    )
    return dict
  }
  checkIcon(address?: string | null) {
    if (!address) return undefined

    if (!this.dict) {
      const start = Date.now()
      this.dict = this.createMap()
      console.log((Date.now() - start) / 1000)
    }
    return this.dict[address.toLowerCase()]
  }
}

export default new TokenLogoLookupTable()
