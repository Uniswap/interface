import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'

export function useTDPPreferProjectMarketData(): boolean {
  const rwaCoinGeckoDataEnabled = useFeatureFlag(FeatureFlags.RWACoinGeckoData)
  const rwaMatch = useTDPRWAMatch({ enabled: rwaCoinGeckoDataEnabled })

  return rwaMatch !== undefined
}
