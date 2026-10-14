import { getCumulativeSum, getCumulativeVolume, SingleHistogramData } from '~/components/Charts/VolumeChart/utils'

describe('getCumulativeSum', () => {
  it('returns the value for single-series data', () => {
    const singleData: SingleHistogramData = { value: 42, time: 0 as SingleHistogramData['time'] }
    expect(getCumulativeSum(singleData)).toBe(42)
  })

  it('sums volume only, never the per-bar fees riding along with it', () => {
    const singleData: SingleHistogramData = { value: 42, feesUsd: 3, time: 0 as SingleHistogramData['time'] }
    expect(getCumulativeSum(singleData)).toBe(42)
  })
})

describe('getCumulativeVolume', () => {
  it('sums the value across all bars', () => {
    const data: SingleHistogramData[] = [
      { value: 10, time: 0 as SingleHistogramData['time'] },
      { value: 20, time: 1 as SingleHistogramData['time'] },
    ]
    expect(getCumulativeVolume(data)).toBe(30)
  })

  it('returns 0 for no bars', () => {
    expect(getCumulativeVolume([])).toBe(0)
  })
})
