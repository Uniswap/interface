import { FortmaticConnector as FortmaticConnectorCore } from '@web3-react/fortmatic-connector'

export const OVERLAY_READY = 'OVERLAY_READY'

const chainIdToNetwork = {
  1: 'mainnet',
  3: 'ropsten',
  4: 'rinkeby',
  42: 'kovan'
}

export class FortmaticConnector extends FortmaticConnectorCore {
  async activate() {
    if (!this.fortmatic) {
      const { default: Fortmatic } = await import('fortmatic')
      this.fortmatic = new Fortmatic(
        this.apiKey,
        this.chainId === 1 || this.chainId === 4 ? undefined : chainIdToNetwork[this.chainId]
      )
    }

    const provider = this.fortmatic.getProvider()

    const pollForOverlayReady = new Promise(resolve => {
      const interval = setInterval(() => {
        if (provider.overlayReady) {
          clearInterval(interval)
          this.emit(OVERLAY_READY)
          resolve()
        }
      }, 200)
    })

    const [account] = await Promise.all([provider.enable().then(accounts => accounts[0]), pollForOverlayReady])

    return { provider: this.fortmatic.getProvider(), chainId: this.chainId, account }
  }
}
