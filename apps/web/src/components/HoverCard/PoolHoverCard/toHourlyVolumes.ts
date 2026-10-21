import { HOURS_IN_DAY, MINUTES_IN_HOUR, SECONDS_IN_MINUTE } from 'utilities/src/time/time'

const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * MINUTES_IN_HOUR

/** Sums buckets into 24 hourly slots ending at the latest bucket, oldest first. The DAY series can come back
 *  finer than hourly, and anything older than the first slot folds into it, so no volume is dropped. */
export function toHourlyVolumes(buckets: { timestamp: bigint; volumeUsd: number }[]): number[] {
  const lastBucket = buckets.at(-1)
  if (!lastBucket) {
    return []
  }

  const lastHour = Math.floor(Number(lastBucket.timestamp) / SECONDS_IN_HOUR)
  const firstHour = lastHour - HOURS_IN_DAY + 1
  const hourly = new Array<number>(HOURS_IN_DAY).fill(0)
  for (const { timestamp, volumeUsd } of buckets) {
    const slot = Math.max(0, Math.floor(Number(timestamp) / SECONDS_IN_HOUR) - firstHour)
    hourly[slot] += volumeUsd
  }
  return hourly
}
