import { config } from 'src/config'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { ChainState } from 'src/features/chains/types'

// TODO hard-coding in a list of active chains to work
// around hook ordering issue for multichain multicall
export function useActiveChainIds(): ChainId[] {
  return config.activeChains
  // const chains = useAppSelector((state) => state.chains.byChainId)
  // return useMemo(() => getActiveChainIds(chains), [chains])
}

// TODO hard-coding in a list of active chains to work
// around hook ordering issue for multichain multicall
export function* selectActiveChainIds() {
  return config.activeChains
  // const chains = yield* appSelect((s) => s.chains.byChainId)
  // return getActiveChainIds(chains)
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
  return chainIds.reduce((memo, chainId) => {
    memo[chainId] = { isActive: true }
    return memo
  }, {} as ChainIdTo<ChainState>)
}
