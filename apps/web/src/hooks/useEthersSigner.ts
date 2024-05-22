import { Web3Provider } from '@ethersproject/providers'
import { useMemo } from 'react'
import type { Account, Chain, Client, Transport } from 'viem'
import { Config, useConnectorClient } from 'wagmi'

function clientToSigner(client?: Client<Transport, Chain, Account>) {
  if (!client) return undefined
  const { chain, transport, account } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new Web3Provider(transport, network)
  return provider.getSigner(account.address)
}

/** Hook to convert a Viem Client to an ethers.js Signer. */
// TODO(wagmi migration): Remove eslinst disable when hook is used
// eslint-disable-next-line import/no-unused-modules
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId })
  return useMemo(() => clientToSigner(client), [client])
}
