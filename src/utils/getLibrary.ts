import { Web3Provider } from '@ethersproject/providers'

export const POOLING_INTERVAL = 15000

export default function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider, 'any')
  library.pollingInterval = POOLING_INTERVAL
  return library
}
