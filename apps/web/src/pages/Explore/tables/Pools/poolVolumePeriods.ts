import { PoolSortFields } from '~/data/pools/poolStats'
import { TimePeriod } from '~/data/util'
import type { LivePoolVolumePeriod } from '~/features/Explore/timeLabels'
import type { PoolStat } from '~/types/explore'

export const POOL_VOLUME_PERIOD_CONFIG: Record<
  LivePoolVolumePeriod,
  { volumeField: 'volume1Day' | 'volume30Day'; sortField: PoolSortFields; ratioSortable: boolean }
> = {
  [TimePeriod.DAY]: {
    volumeField: 'volume1Day',
    sortField: PoolSortFields.Volume24h,
    ratioSortable: true,
  },
  [TimePeriod.MONTH]: {
    volumeField: 'volume30Day',
    sortField: PoolSortFields.Volume30D,
    ratioSortable: false,
  },
}

export function getPoolSortMethodForPeriod(sortMethod: PoolSortFields, period?: LivePoolVolumePeriod): PoolSortFields {
  if (period === undefined) {
    return sortMethod
  }
  const config = POOL_VOLUME_PERIOD_CONFIG[period]
  const isVolume = sortMethod === PoolSortFields.Volume24h || sortMethod === PoolSortFields.Volume30D
  return isVolume || (sortMethod === PoolSortFields.VolOverTvl && !config.ratioSortable) ? config.sortField : sortMethod
}

export function getPoolVolumePeriodStats(
  pool: Pick<PoolStat, 'volume1Day' | 'volume30Day' | 'totalLiquidity' | 'volOverTvl'>,
  period: LivePoolVolumePeriod,
): { volume?: number; volOverTvl?: number } {
  const { volumeField, ratioSortable } = POOL_VOLUME_PERIOD_CONFIG[period]
  // Read raw optional values so unavailable metrics stay distinct from real zeros.
  const volume = pool[volumeField]?.value
  if (ratioSortable) {
    return { volume, volOverTvl: pool.volOverTvl }
  }
  const tvl = pool.totalLiquidity?.value
  return { volume, volOverTvl: volume !== undefined && tvl !== undefined && tvl > 0 ? volume / tvl : undefined }
}
