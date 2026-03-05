import { Token as DataApiToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TimePeriod } from '~/appGraphql/data/util'

/**
 * Gets the volume value for the given time period from the token stats
 */
export function getVolumeForTimePeriod(stats: DataApiToken['stats'], timePeriod: TimePeriod): number | undefined {
  if (!stats) {
    return undefined
  }
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return stats.volume1h
    case TimePeriod.DAY:
      return stats.volume1d
    case TimePeriod.WEEK:
      return stats.volume7d
    case TimePeriod.MONTH:
      return stats.volume30d
    case TimePeriod.YEAR:
    case TimePeriod.MAX:
      return stats.volume1y
    default:
      return stats.volume1d
  }
}
