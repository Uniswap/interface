import { ethers } from 'ethers'
import { Connectors } from 'web3-react'

const { Connector } = Connectors

function getFallbackProvider(providerURL) {
  const etherscan = new ethers.providers.EtherscanProvider()
  const infura = new ethers.providers.JsonRpcProvider(providerURL)

  const providers = [infura, etherscan]

  return new ethers.providers.FallbackProvider(providers)
}

export default class NetworkOnlyConnector extends Connector {
  constructor(kwargs) {
    const { providerURL, ...rest } = kwargs || {}
    super(rest)
    this.providerURL = providerURL
  }

  async onActivation() {
    if (!this.engine) {
      const provider = getFallbackProvider(this.providerURL)
      provider.polling = false
      provider.pollingInterval = 300000 // 5 minutes
      this.engine = provider
    }
  }

  async getNetworkId(provider) {
    const networkId = await provider.getNetwork().then(network => network.chainId)
    return super._validateNetworkId(networkId)
  }

  async getProvider() {
    return this.engine
  }

  async getAccount() {
    return null
  }
}
