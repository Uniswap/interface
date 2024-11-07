import { Web3Provider } from '@ethersproject/providers'
import { useMemo } from 'react'
import { UniverseChainInfo } from 'uniswap/src/features/chains/types'
import type { Account, Client, Transport } from 'viem'
import { useConnectorClient } from 'wagmi'

function clientToSigner(client?: Client<Transport, UniverseChainInfo, Account>) {
  if (!client || !client.chain) {
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
