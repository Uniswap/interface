import type { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import type { RWACandidate } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAMatch } from 'uniswap/src/features/rwa/useRWAMatch'

export function usePreferProjectMarketData(candidates: RWACandidate[]): boolean {
  const rwaCoinGeckoDataEnabled = useFeatureFlag(FeatureFlags.RWACoinGeckoData)
  const rwaMatch = useRWAMatch({ candidates, enabled: rwaCoinGeckoDataEnabled })

  return rwaMatch !== undefined
}

export function usePreferProjectMarketDataForCurrency(currency: Currency): boolean {
  const candidates = useMemo(() => getRWACandidatesFromCurrency(currency), [currency])

  return usePreferProjectMarketData(candidates)
}
