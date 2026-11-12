import { describe, expect, it } from 'vitest'
import { TimePeriod } from '~/data/util'
import { getPoolVolumePeriodStats } from '~/pages/Explore/tables/Pools/poolVolumePeriods'

describe('pool volume period stats', () => {
  it('keeps the served 1D ratio and calculates the 30D ratio from that period', () => {
    const pool = {
      volume1Day: { value: 40 },
      volume30Day: { value: 900 },
      totalLiquidity: { value: 100 },
      volOverTvl: 0.39,
    }
    expect(getPoolVolumePeriodStats(pool, TimePeriod.DAY)).toEqual({ volume: 40, volOverTvl: 0.39 })
    expect(getPoolVolumePeriodStats(pool, TimePeriod.MONTH)).toEqual({ volume: 900, volOverTvl: 9 })
  })

  it.each([
    { volume: 0, tvl: 100, ratio: 0 },
    { volume: undefined, tvl: 100, ratio: undefined },
    { volume: 100, tvl: 0, ratio: undefined },
    { volume: 100, tvl: undefined, ratio: undefined },
  ])('preserves volume=$volume and leaves the ratio unavailable for TVL=$tvl', ({ volume, tvl, ratio }) => {
    const pool = {
      volume1Day: { value: 50 },
      volume30Day: volume === undefined ? undefined : { value: volume },
      totalLiquidity: tvl === undefined ? undefined : { value: tvl },
      volOverTvl: 0.5,
    }
    expect(getPoolVolumePeriodStats(pool, TimePeriod.MONTH)).toEqual({ volume, volOverTvl: ratio })
  })
})
