import { useMemo } from 'react'
import { appSelect, useAppSelector } from 'src/app/hooks'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { ChainState } from 'src/features/chains/types'

export function useActiveChainIds(): ChainId[] {
  const chains = useAppSelector((state) => state.chains.byChainId)
  return useMemo(() => getSortedActiveChainIds(chains), [chains])
}

export function* selectActiveChainIds() {
  const chains = yield* appSelect((s) => s.chains.byChainId)
  return getSortedActiveChainIds(chains)
}

export function getSortedActiveChainIds(chains: ChainIdTo<ChainState>) {
  return (
    Object.keys(chains)
      .map(Number)
      .sort()
      // filter maintains order
      .filter((n: ChainId) => !!chains[n]?.isActive) as ChainId[]
  )
}

export function chainListToStateMap(chainIds: ChainId[]) {
  return chainIds.reduce<ChainIdTo<ChainState>>((memo, chainId) => {
    memo[chainId] = { isActive: true }
    return memo
  }, {})
}
