import store from '../state'
import { DEFAULT_LIST_OF_LISTS } from './lists'

class TokenLogoLookupTable {
  dict: { [key: string]: string | undefined } | null = null

  createMap() {
    const dict: { [key: string]: string | undefined } = {}

    const lists = DEFAULT_LIST_OF_LISTS
    lists.forEach((list) =>
      store.getState().lists.byUrl[list].current?.tokens.forEach((token) => {
        if (token.logoURI?.includes('.eth')) console.log(token)
        return token.logoURI && (dict[token.address.toLowerCase()] = token.logoURI)
      })
    )
    return dict
  }
  checkIcon(address?: string | null) {
    if (!address) return undefined

    if (!this.dict) {
      const startTime = Date.now()
      this.dict = this.createMap()
      console.log((Date.now() - startTime) / 1000)
    }
    return this.dict[address]
  }
}

export default new TokenLogoLookupTable()
