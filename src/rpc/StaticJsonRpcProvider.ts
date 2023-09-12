import { deepCopy } from '@ethersproject/properties'
// This is the only file which should instantiate new Providers.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import { isPlain } from '@reduxjs/toolkit'

import { AVERAGE_L1_BLOCK_TIME } from '../constants/chainInfo'
import { CHAIN_IDS_TO_NAMES, SupportedInterfaceChain } from '../constants/chains'

export default class AppStaticJsonRpcProvider extends StaticJsonRpcProvider {
  private _blockCache = new Map<string, Promise<any>>()
  get blockCache() {
    // If the blockCache has not yet been initialized this block, do so by
    // setting a listener to clear it on the next block.
    if (!this._blockCache.size) {
      this.once('block', () => this._blockCache.clear())
    }
    return this._blockCache
  }

  constructor(chainId: SupportedInterfaceChain, url: string) {
    // Including networkish allows ethers to skip the initial detectNetwork call.
    super(url, /* networkish= */ { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })

    // NB: Third-party providers (eg MetaMask) will have their own polling intervals,
    // which should be left as-is to allow operations (eg transaction confirmation) to resolve faster.
    // Network providers (eg AppStaticJsonRpcProvider) need to update less frequently to be considered responsive.
    this.pollingInterval = AVERAGE_L1_BLOCK_TIME
  }

  send(method: string, params: Array<any>): Promise<any> {
    // Only cache eth_call's.
    if (method !== 'eth_call') return super.send(method, params)

    // Only cache if params are serializable.
    if (!isPlain(params)) return super.send(method, params)

    const key = `call:${JSON.stringify(params)}`
    const cached = this.blockCache.get(key)
    if (cached) {
      this.emit('debug', {
        action: 'request',
        request: deepCopy({ method, params, id: 'cache' }),
        provider: this,
      })
      return cached
    }

    const result = super.send(method, params)
    this.blockCache.set(key, result)
    return result
  }
}
