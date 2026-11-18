import type { VolumeOrderBy } from '@universe/data-api'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { timePeriodToVolumeOrderBy } from '~/features/Explore/state/listTokens/utils/topTokensOrderByMappings'

/** The volume sort window matching the Explore timeframe selector. */
export function useSelectedVolumeOrderBy(): VolumeOrderBy {
  const timePeriod = useExploreTablesFilterStore((s) => s.timePeriod)
  return timePeriodToVolumeOrderBy[timePeriod]
}
