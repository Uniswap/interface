import { NetworkConnector as NetworkConnectorCore } from '@web3-react/network-connector'

export class NetworkConnector extends NetworkConnectorCore {
  pause() {
    if ((this as any).active) {
      (this as any).providers[(this as any).currentChainId].stop()
    }
  }

  resume() {
    if ((this as any).active) {
      (this as any).providers[(this as any).currentChainId].start()
    }
  }
}
