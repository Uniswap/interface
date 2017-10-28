import { NetworkConnector as NetworkConnectorCore } from '@web3-react/network-connector'

export class NetworkConnector extends NetworkConnectorCore {
  pause() {
    if (this.active) {
      this.providers[this.currentChainId].stop()
    }
  }

  resume() {
    if (this.active) {
      this.providers[this.currentChainId].start()
    }
  }
}
