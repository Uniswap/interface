import { useMemo } from 'react'
import { SelectEffect } from 'redux-saga/effects'
import { appSelect, useAppSelector } from 'src/app/hooks'
import {
  ALL_SUPPORTED_CHAIN_IDS,
  ChainId,
  ChainIdTo,
  ChainState,
} from 'wallet/src/constants/chains'

export function useActiveChainIds(): ChainId[] {
  const chains = useAppSelector((state) => state.chains.byChainId)
  return useMemo(() => getSortedActiveChainIds(chains), [chains])
}

export function* selectActiveChainIds(): Generator<SelectEffect, ChainId[], unknown> {
  const chains = yield* appSelect((s) => s.chains.byChainId)
  return getSortedActiveChainIds(chains)
}

// ALL_SUPPORTED_CHAINS is manually sorted by chain TVL
export function getSortedActiveChainIds(chains: ChainIdTo<ChainState>): ChainId[] {
  return ALL_SUPPORTED_CHAIN_IDS.filter((n: ChainId) => !!chains[n]?.isActive)
}
