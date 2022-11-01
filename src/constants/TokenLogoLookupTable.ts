import store from '../state'
import { DEFAULT_LIST_OF_LISTS } from './lists'

class TokenLogoLookupTable {
  dict: { [key: string]: string | undefined } | null = null

  createMap() {
    const dict: { [key: string]: string | undefined } = {}

    const lists = DEFAULT_LIST_OF_LISTS
    lists.forEach((list) =>
      store.getState().lists.byUrl[list].current?.tokens.forEach((token) => {
        if (token.logoURI?.includes('.eth')) alert(token)
        return token.logoURI && (dict[token.address.toLowerCase()] = token.logoURI)
      })
    )
    return dict
  }
  checkIcon(address?: string | null) {
    if (!address) return undefined

    if (!this.dict) {
      this.dict = this.createMap()
    }
    return this.dict[address.toLowerCase()]
  }
}

export default new TokenLogoLookupTable()
