import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// eslint-disable-next-line import/no-unused-modules -- shim is used via a build alias in craco.config.cjs
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
