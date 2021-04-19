import { Web3Provider } from '@ethersproject/providers'
import { MiniRpcProvider } from '../connectors/NetworkConnector'

export default function getLibrary(provider: any): Web3Provider {
  // ethers tries to detect the network which fails and is unnecessary with our mini rpc provider if we do not pass the correct network id
  if (provider instanceof MiniRpcProvider) {
    return new Web3Provider(provider as any, provider.chainId)
  }
  const library = new Web3Provider(provider, 'any')
  library.pollingInterval = 15000
  return library
}
