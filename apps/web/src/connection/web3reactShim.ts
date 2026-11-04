import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useAccount } from '~/connection/hooks/useAccount'
import { useEthersProvider, useEthersWeb3Provider } from '~/connection/hooks/useEthersProvider'

export function useWeb3React() {
  const account = useAccount()
  // Legacy shim consumers sign through this provider (claim, offramp), so it keeps
  // the historical wallet-when-connected behavior; reads fall back to the app provider.
  const walletProvider = useEthersWeb3Provider({ chainId: account.chainId })
  const readProvider = useEthersProvider({ chainId: account.chainId })
  const provider = walletProvider ?? readProvider

  return useMemo(
    () => ({
      account: account.address,
      chainId: account.chainId ?? UniverseChainId.Mainnet,
      provider,
    }),
    [account.address, account.chainId, provider],
  )
}
