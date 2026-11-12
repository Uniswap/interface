import { TimePeriod } from '~/data/util'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'

export function useEffectiveVolumeTimePeriod<T extends TimePeriod>(supportedPeriods: readonly T[]): T | TimePeriod.DAY
export function useEffectiveVolumeTimePeriod(supportedPeriods?: readonly TimePeriod[]): TimePeriod
export function useEffectiveVolumeTimePeriod(supportedPeriods?: readonly TimePeriod[]): TimePeriod {
  const timePeriod = useExploreTablesFilterStore((state) => state.timePeriod)
  return supportedPeriods && !supportedPeriods.includes(timePeriod) ? TimePeriod.DAY : timePeriod
}
