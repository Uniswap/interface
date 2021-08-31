import { Web3Provider, Network } from '@ethersproject/providers'

class WorkaroundWeb3Provider extends Web3Provider {
  private _detectNetworkResult: Promise<Network> | null = null

  async detectNetwork(): Promise<Network> {
    return this._detectNetworkResult ?? (this._detectNetworkResult = this._uncachedDetectNetwork())
  }
}

export default function getLibrary(provider: any): Web3Provider {
  const library = new WorkaroundWeb3Provider(
    provider,
    typeof provider.chainId === 'number'
      ? provider.chainId
      : typeof provider.chainId === 'string'
      ? parseInt(provider.chainId)
      : 'any'
  )
  library.pollingInterval = 15000
  return library
}
