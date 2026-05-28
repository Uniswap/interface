import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAccount } from '~/hooks/useAccount'
import { useEthersProvider } from '~/hooks/useEthersProvider'

export function useWeb3React() {
  const account = useAccount()
  const provider = useEthersProvider({ chainId: account.chainId })

  return useMemo(
    () => ({
      account: account.address,
      chainId: account.chainId ?? UniverseChainId.Mainnet,
      provider,
    }),
    [account.address, account.chainId, provider],
  )
}
