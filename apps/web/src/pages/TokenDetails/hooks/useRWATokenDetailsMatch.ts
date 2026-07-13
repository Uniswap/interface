import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useTDPRWAMatch } from '~/pages/TokenDetails/hooks/useTDPRWAMatch'

// Gates an RWA TDP surface behind a feature flag plus an RWA match. Defaults to RWATdp
export function useRWATokenDetailsMatch(flag: FeatureFlags = FeatureFlags.RWATdp): RWAMatch | undefined {
  const enabled = useFeatureFlag(flag)
  return useTDPRWAMatch({ enabled })
}
