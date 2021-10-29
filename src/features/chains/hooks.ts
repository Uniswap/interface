import { useMemo } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { ChainIdTo, SupportedChainId } from 'src/constants/chains'
import { ChainState } from 'src/features/chains/types'

export function useActiveChainIds(): SupportedChainId[] {
  const chains = useAppSelector((state) => state.chains.byChainId)
  return useMemo(() => getActiveChainIds(chains), [chains])
}

export function getActiveChainIds(chains: ChainIdTo<ChainState>) {
  return Object.keys(chains)
    .map(Number)
    .filter((n: SupportedChainId) => !!chains[n]?.isActive) as SupportedChainId[]
}
