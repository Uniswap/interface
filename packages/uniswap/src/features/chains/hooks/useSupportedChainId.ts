import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'

export function createGetSupportedChainId(ctx: { getChains: () => UniverseChainId[] }): {
  getSupportedChainId: (chainId?: number | UniverseChainId) => UniverseChainId | undefined
  isSupportedChainId: (chainId?: number | UniverseChainId) => chainId is UniverseChainId
} {
  function getSupportedChainId(chainId?: number | UniverseChainId): UniverseChainId | undefined {
    const chains = ctx.getChains()
    return chains.includes(chainId as UniverseChainId) ? (chainId as UniverseChainId) : undefined
  }
  function isSupportedChainId(chainId?: number | UniverseChainId): chainId is UniverseChainId {
    return getSupportedChainId(chainId) !== undefined
  }
  return { getSupportedChainId, isSupportedChainId }
}

export function useSupportedChainId(chainId?: number | UniverseChainId): UniverseChainId | undefined {
  const { chains } = useEnabledChains()
  const getChains = useEvent(() => chains)
  return createGetSupportedChainId({ getChains }).getSupportedChainId(chainId)
}

export function useIsSupportedChainId(chainId?: number | UniverseChainId): chainId is UniverseChainId {
  const supportedChainId = useSupportedChainId(chainId)
  return supportedChainId !== undefined
}

export function useIsSupportedChainIdCallback(): (chainId?: number | UniverseChainId) => chainId is UniverseChainId {
  const { chains } = useEnabledChains()
  return useEvent((chainId?: number | UniverseChainId): chainId is UniverseChainId => {
    return createGetSupportedChainId({ getChains: () => chains }).isSupportedChainId(chainId)
  })
}
