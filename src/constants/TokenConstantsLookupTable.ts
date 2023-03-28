import store from 'state'

import { SupportedChainId } from './chains'
import { DEFAULT_LIST_OF_LISTS } from './lists'

type lookupKey = `0x${string}:${SupportedChainId}`
interface TokenConstants {
  decimals?: number // uint8
  name?: string
  symbol?: string
  chainChecked: boolean
}
class TokenConstantsLookupTable {
  private dict: Record<lookupKey, TokenConstants | undefined> = {}
  private initialized = false

  initialize() {
    const dict: Record<lookupKey, TokenConstants | undefined> = {}

    DEFAULT_LIST_OF_LISTS.forEach((list) => {
      const listData = store.getState().lists.byUrl[list]
      if (!listData) {
        return
      }
      listData.current?.tokens.forEach((token) => {
        const lowercaseAddress = token.address.toLowerCase()
        const key = `${lowercaseAddress}:${token.chainId}` as lookupKey
        const entry: TokenConstants = { chainChecked: false }
        if (token.decimals) entry.decimals = token.decimals
        if (token.name) entry.name = token.name
        if (token.symbol) entry.symbol = token.symbol
        if (Object.keys(entry).length > 0) dict[key] = entry
      })
    })
    this.dict = dict
    this.initialized = true
  }
  getField(field: 'decimals' | 'name' | 'symbol', chainId: SupportedChainId | null = 1, address?: string | null) {
    if (!address) return undefined

    if (!this.initialized) {
      this.initialize()
    }
    const lowercaseAddress = address.toLowerCase()
    const key = `${lowercaseAddress}:${chainId}` as lookupKey
    const tokenData = this.dict[key]

    // case if token data was available from list data accessible during initialization
    if (tokenData && tokenData[field]) return tokenData[field]

    // todo: fetch field from the contract
    // todo: set this.dict[key][field] to null if the field isn't defined by the contract
    // todo: set this.dict[key][field] to value fetched from the contract
    return tokenData[field]
  }
}

export default new TokenConstantsLookupTable()
