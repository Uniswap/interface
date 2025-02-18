import { useCallback } from 'react'
import { useEnabledChains, useEnabledChainsWithConnector } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Connector } from 'wagmi'

export function useSupportedChainId(chainId?: number | UniverseChainId): UniverseChainId | undefined {
  const { chains } = useEnabledChains()
  return chains.includes(chainId as UniverseChainId) ? (chainId as UniverseChainId) : undefined
}

export function useIsSupportedChainId(chainId?: number | UniverseChainId): chainId is UniverseChainId {
  const supportedChainId = useSupportedChainId(chainId)
  return supportedChainId !== undefined
}

export function useIsSupportedChainIdCallback(): (chainId?: number | UniverseChainId) => chainId is UniverseChainId {
  const { chains } = useEnabledChains()

  return useCallback(
    (chainId?: number | UniverseChainId): chainId is UniverseChainId => {
      return chains.includes(chainId as UniverseChainId)
    },
    [chains],
  )
}

export function useSupportedChainIdWithConnector(
  chainId?: number | UniverseChainId,
  connector?: Connector,
): UniverseChainId | undefined {
  const { chains } = useEnabledChainsWithConnector(connector)
  return chains.includes(chainId as UniverseChainId) ? (chainId as UniverseChainId) : undefined
}
