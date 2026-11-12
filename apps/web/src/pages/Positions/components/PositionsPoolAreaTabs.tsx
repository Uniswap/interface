import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { usePoolAreaNavigation } from '~/features/Explore/poolArea/hooks/usePoolAreaNavigation'
import { PoolAreaTab } from '~/features/Explore/poolArea/types'
import { PoolAreaTabs } from '~/features/Liquidity/PoolAreaTabs'

export function PositionsPoolAreaTabs(): JSX.Element | null {
  const enabled = useFeatureFlag(FeatureFlags.HooksExplore)
  const urls = usePoolAreaNavigation()

  return enabled ? <PoolAreaTabs activeTab={PoolAreaTab.Positions} urls={urls} /> : null
}
