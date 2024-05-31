import { ChainId } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useMemo } from 'react'

// eslint-disable-next-line import/no-unused-modules -- shim is used via a build alias in craco.config.cjs
export function useWeb3React() {
  const { address, chainId } = useAccount()
  const provider = useEthersProvider({ chainId })

  return useMemo(
    () => ({
      account: address,
      chainId: chainId ?? ChainId.MAINNET,
      provider,
    }),
    [address, chainId, provider]
  )
}
