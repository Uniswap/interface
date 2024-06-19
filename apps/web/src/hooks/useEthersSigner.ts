import { Web3Provider } from '@ethersproject/providers'
import { SupportedInterfaceChain } from 'constants/chains'
import { useMemo } from 'react'
import type { Account, Client, Transport } from 'viem'
import { useConnectorClient } from 'wagmi'

function clientToSigner(client?: Client<Transport, SupportedInterfaceChain, Account>) {
  if (!client || !client.chain) {
    return undefined
  }
  const { chain, transport, account } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts
      ? 'ensRegistry' in chain.contracts
        ? chain.contracts.ensRegistry?.address
        : undefined
      : undefined,
  }
  const provider = new Web3Provider(transport, network)
  return provider.getSigner(account.address)
}

/** Hook to convert a Viem Client to an ethers.js Signer. */
// TODO(wagmi migration): Remove eslinst disable when hook is used
// eslint-disable-next-line import/no-unused-modules
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient({ chainId })
  return useMemo(() => clientToSigner(client), [client])
}
