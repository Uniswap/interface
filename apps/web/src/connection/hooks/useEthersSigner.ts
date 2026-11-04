import { Web3Provider } from '@ethersproject/providers'
import { useMemo } from 'react'
import type { Account, Chain, Client, Transport } from 'viem'
import { useConnectorClient } from 'wagmi'

function clientToSigner(client?: Client<Transport, Chain, Account>) {
  // despite the types, wagmi v3 can resolve a client with no account (mid-disconnect) or no chain (unsupported network)
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  if (!client?.account || !client.chain) {
    return undefined
  }
  const { chain, transport, account } = client
  const ensAddress = chain.contracts?.ensRegistry?.address
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress,
  }
  const provider = new Web3Provider(transport, network)
  return provider.getSigner(account.address)
}

/** Hook to convert a Viem Client to an ethers.js Signer. */
export function useEthersSigner() {
  const { data: client } = useConnectorClient()
  return useMemo(() => clientToSigner(client), [client])
}
