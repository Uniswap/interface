import { Web3Provider } from '@ethersproject/providers'
import { useMemo } from 'react'
import type { Chain, Client, Transport } from 'viem'
import { Config, useConnectorClient } from 'wagmi'

const providers = new WeakMap<Client, Web3Provider>()

function clientToProvider(client?: Client<Transport, Chain>, chainId?: number) {
  if (!client) return undefined
  const { chain, transport } = client
  const network = chain
    ? {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
      }
    : chainId
    ? { chainId, name: 'Unsupported' }
    : undefined
  if (!network) return undefined

  if (providers?.has(client)) {
    return providers.get(client)
  } else {
    const provider = new Web3Provider(transport, network)
    providers.set(client, provider)
    return provider
  }
}

/** Hook to convert a viem Client to an ethers.js Provider. */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId })
  return useMemo(() => clientToProvider(client, chainId), [chainId, client])
}

/** Hook to convert a viem Client to an ethers.js Provider. */
export function useEthersWeb3Provider({ chainId }: { chainId?: number } = {}) {
  const provider = useEthersProvider({ chainId })
  return useMemo(() => (provider instanceof Web3Provider ? provider : undefined), [provider])
}
