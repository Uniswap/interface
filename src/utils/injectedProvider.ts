import { Web3Provider } from '@ethersproject/providers'

type Network = {
  name: string
  chainId: number
  ensAddress?: string
}

type Networkish = Network | string | number

export default function getInjectedProvider(network: Networkish = 'any') {
  if (window && window.ethereum) {
    return new Web3Provider(
      // The globalThis property provides a standard way of accessing the global this value
      // across environments (e.g. unit tests in Node vs browser)
      window.ethereum,
      network
    )
  }

  return null
}
