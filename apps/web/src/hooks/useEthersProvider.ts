import { FallbackProvider, StaticJsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { useMemo } from 'react'
import type { Chain, Client, Transport } from 'viem'
import { Config, useClient } from 'wagmi'

function clientToProvider(client?: Client<Transport, Chain>) {
  if (!client) return undefined
  const { chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  if (transport.type === 'fallback')
    return new FallbackProvider(
      (transport.transports as ReturnType<Transport>[]).map(
        ({ value }) => new StaticJsonRpcProvider(value?.url, network)
      )
    )
  return new Web3Provider(transport, network)
}

/** Hook to convert a viem Client to an ethers.js Provider. */
// TODO(wagmi migration): Remove eslinst disable when hook is used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const client = useClient<Config>({ chainId })
  return useMemo(() => clientToProvider(client), [client])
}
