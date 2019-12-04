import { PortisConnector as PortisConnectorCore } from '@web3-react/portis-connector'

export class PortisConnector extends PortisConnectorCore {
  getPortis() {
    return this.portis
  }
}
