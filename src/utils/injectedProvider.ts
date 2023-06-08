import { Web3Provider } from '@ethersproject/providers'

type Network = {
  name: string
  chainId: number
  ensAddress?: string
}

type Networkish = Network | string | number

export default function getInjectedProvider(network: Networkish = 'any') {
  if (window && window.ethereum) {
    return new Web3Provider(window.ethereum, network)
  }

  return null
}
