import { useEthersProvider } from 'hooks/useEthersProvider'
import { useMemo } from 'react'
import { useAccount, useChainId } from 'wagmi'

// eslint-disable-next-line import/no-unused-modules -- shim is used via a build alias in craco.config.cjs
export function useWeb3React() {
  // When connected via an unsupported network chainId !== disconnectedChainId
  const { address, chainId } = useAccount()
  const disconnectedChainId = useChainId()
  const provider = useEthersProvider({ chainId })

  return useMemo(
    () => ({
      account: address,
      chainId: chainId ?? disconnectedChainId,
      provider,
    }),
    [address, chainId, disconnectedChainId, provider]
  )
}
