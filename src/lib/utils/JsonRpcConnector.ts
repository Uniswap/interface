import { JsonRpcProvider } from '@ethersproject/providers'
import { Actions, Connector, ProviderConnectInfo, ProviderRpcError } from '@web3-react/types'

function parseChainId(chainId: string) {
  return Number.parseInt(chainId, 16)
}

export default class JsonRpcConnector extends Connector {
  constructor(actions: Actions, public customProvider: JsonRpcProvider) {
    super(actions)
    customProvider
      .on('connect', ({ chainId }: ProviderConnectInfo): void => {
        this.actions.update({ chainId: parseChainId(chainId) })
      })
      .on('disconnect', (error: ProviderRpcError): void => {
        this.actions.reportError(error)
      })
      .on('chainChanged', (chainId: string): void => {
        this.actions.update({ chainId: parseChainId(chainId) })
      })
      .on('accountsChanged', (accounts: string[]): void => {
        this.actions.update({ accounts })
      })
  }

  async activate() {
    this.actions.startActivation()

    try {
      const [{ chainId }, accounts] = await Promise.all([
        this.customProvider.getNetwork(),
        this.customProvider.listAccounts(),
      ])
      this.actions.update({ chainId, accounts })
    } catch (e) {
      this.actions.reportError(e)
    }
  }
}
