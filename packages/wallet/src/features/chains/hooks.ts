import { useMemo } from 'react'
import { ChainId } from 'wallet/src/constants/chains'
import { useAppSelector } from 'wallet/src/state'
import { getSortedActiveChainIds } from './utils'

export function useActiveChainIds(): ChainId[] {
  const chains = useAppSelector((state) => state.chains.byChainId)
  return useMemo(() => getSortedActiveChainIds(chains), [chains])
}
