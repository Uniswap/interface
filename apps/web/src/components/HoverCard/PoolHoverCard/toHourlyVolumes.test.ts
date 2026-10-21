import { toHourlyVolumes } from '~/components/HoverCard/PoolHoverCard/toHourlyVolumes'

const HOUR = 3600
const BASE = 1_700_000_000 - (1_700_000_000 % HOUR)
const bucket = (secondsFromBase: number, volumeUsd: number) => ({
  timestamp: BigInt(BASE + secondsFromBase),
  volumeUsd,
})

describe('toHourlyVolumes', () => {
  it('returns no bars for an empty series', () => {
    expect(toHourlyVolumes([])).toEqual([])
  })

  it('keeps an hourly series as 24 bars, oldest first', () => {
    const buckets = Array.from({ length: 24 }, (_, i) => bucket(i * HOUR, i + 1))

    expect(toHourlyVolumes(buckets)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1))
  })

  it('sums finer buckets into hours without dropping early volume', () => {
    // A six-hour-old pool served in ten-minute buckets: 36 entries, all early volume in the first hour.
    const buckets = Array.from({ length: 36 }, (_, i) => bucket(i * 600, i < 6 ? 100 : 0))

    const hourly = toHourlyVolumes(buckets)

    expect(hourly).toHaveLength(24)
    expect(hourly.reduce((sum, v) => sum + v, 0)).toBe(600)
    expect(hourly[18]).toBe(600)
  })

  it('folds volume older than the first slot into it', () => {
    const buckets = [bucket(-30 * 60, 5), ...Array.from({ length: 24 }, (_, i) => bucket(i * HOUR, 1))]

    const hourly = toHourlyVolumes(buckets)

    expect(hourly[0]).toBe(6)
    expect(hourly.reduce((sum, v) => sum + v, 0)).toBe(29)
  })
})
