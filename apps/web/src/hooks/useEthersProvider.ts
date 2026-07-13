import { Web3Provider } from '@ethersproject/providers'
import { useMemo } from 'react'
import type { Chain, Client, Transport } from 'viem'
import { useClient, useConnectorClient } from 'wagmi'

const providers = new WeakMap<Client, Web3Provider>()

export function clientToProvider(client?: Client<Transport, Chain>, chainId?: number) {
  if (!client) {
    return undefined
  }
  const { chain, transport } = client

  // oxlint-disable-next-line typescript/no-unnecessary-condition
  const network = chain
    ? {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
      }
    : chainId
      ? { chainId, name: 'Unsupported' }
      : undefined
  if (!network) {
    return undefined
  }

  if (providers.has(client)) {
    return providers.get(client)
  } else {
    const provider = new Web3Provider(transport, network)
    providers.set(client, provider)
    return provider
  }
}

/**
 * READ-ONLY provider — always backed by the app's own transport (UniRPC), never the
 * connected wallet. Reads must not route through connector providers: connector SDKs
 * serve them from `chain.rpcUrls.default` via cookieless HTTP clients, which bypasses
 * UniRPC sessions/observability and breaks when the legacy endpoints are disabled.
 * Do not call `.getSigner()` on this — for signing use `useEthersWeb3Provider` or `useEthersSigner`.
 */
export function useEthersProvider({ chainId }: { chainId?: number } = {}) {
  const disconnectedClient = useClient({ chainId })
  return useMemo(() => clientToProvider(disconnectedClient, chainId), [chainId, disconnectedClient])
}

/** Hook to convert the connected wallet's viem Client to an ethers.js Provider, for signing flows. */
export function useEthersWeb3Provider({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient({ chainId })
  return useMemo(() => clientToProvider(client, chainId), [chainId, client])
}
