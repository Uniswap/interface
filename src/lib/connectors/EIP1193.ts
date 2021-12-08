import { Eip1193Bridge } from '@ethersproject/experimental'
import { JsonRpcProvider } from '@ethersproject/providers'
import { ZERO_ADDRESS } from 'constants/misc'
import { VoidSigner } from 'ethers'
import { initializeConnector, Web3ReactHooks } from 'widgets-web3-react/core'
import { EIP1193 } from 'widgets-web3-react/eip1193'
import { Provider } from 'widgets-web3-react/types'

interface EIP1193ConnectorConstructorArgs {
  provider?: Provider
  jsonRpcEndpoint?: string
}

export default class EIP1193Connector {
  connector: EIP1193
  hooks: Web3ReactHooks
  constructor({ provider, jsonRpcEndpoint }: EIP1193ConnectorConstructorArgs) {
    if (provider) {
      const [connector, hooks] = initializeConnector<EIP1193>((actions) => new EIP1193(actions, provider))
      this.connector = connector
      this.hooks = hooks
    } else if (jsonRpcEndpoint) {
      const ethersProvider = new JsonRpcProvider(jsonRpcEndpoint)
      const provider = new Eip1193Bridge(new VoidSigner(ZERO_ADDRESS, ethersProvider), ethersProvider)
      const [connector, hooks] = initializeConnector<EIP1193>((actions) => new EIP1193(actions, provider))
      this.connector = connector
      this.hooks = hooks
    } else {
      throw new Error('A provider or rpc url must be provided.')
    }
  }
}
