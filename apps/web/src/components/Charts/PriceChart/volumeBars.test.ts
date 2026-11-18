import { describe, expect, it } from 'vitest'
import { findBarRectAt, getVolumeBarRects, padAnchorsByHalfStep } from '~/components/Charts/PriceChart/volumeBars'

// Price points every 10s, 1px apart per second.
const anchors = [0, 10, 20, 30, 40].map((time) => ({ time, x: time }))

describe('getVolumeBarRects', () => {
  it('spans each bucket to the next, less a gap, scaled to the largest', () => {
    const rects = getVolumeBarRects({
      bars: [
        { time: 0, value: 50 },
        { time: 20, value: 100 },
      ],
      anchors,
      maxHeight: 30,
    })
    expect(rects).toEqual([
      { time: 0, x: 0, width: 16, span: 20, height: 15 },
      // The last bucket runs as long as the one before it.
      { time: 20, x: 20, width: 16, span: 20, height: 30 },
    ])
  })

  it('places a bucket between price points by interpolating', () => {
    const [rect] = getVolumeBarRects({
      bars: [
        { time: 5, value: 1 },
        { time: 15, value: 1 },
      ],
      anchors,
      maxHeight: 10,
    })
    expect(rect.x).toBe(5)
  })

  it('clips buckets outside the price span and skips empty ones', () => {
    const rects = getVolumeBarRects({
      bars: [
        { time: -20, value: 5 },
        { time: -10, value: 0 },
        // Runs past the last price point, so it's cut off there.
        { time: 30, value: 5 },
        { time: 50, value: 5 },
      ],
      anchors,
      maxHeight: 10,
    })
    expect(rects).toEqual([{ time: 30, x: 30, width: 8, span: 10, height: 10 }])
  })

  it('draws nothing without volume or enough price points', () => {
    expect(getVolumeBarRects({ bars: [{ time: 0, value: 0 }], anchors, maxHeight: 10 })).toEqual([])
    expect(getVolumeBarRects({ bars: [{ time: 0, value: 5 }], anchors: anchors.slice(0, 1), maxHeight: 10 })).toEqual(
      [],
    )
  })
})

describe('findBarRectAt', () => {
  // Buckets 0–10 and 20–30 have volume; 10–20 is quiet, so it has no bar.
  const rects = [
    { time: 0, x: 0, width: 8, span: 10, height: 1 },
    { time: 20, x: 20, width: 8, span: 10, height: 1 },
  ]

  it('picks the bar whose bucket spans x, gap included', () => {
    expect(findBarRectAt(rects, 3)?.time).toBe(0)
    expect(findBarRectAt(rects, 9.5)?.time).toBe(0)
    expect(findBarRectAt(rects, 20)?.time).toBe(20)
  })

  it('picks nothing over a quiet bucket or past the bars', () => {
    expect(findBarRectAt(rects, 15)).toBeUndefined()
    expect(findBarRectAt(rects, 500)).toBeUndefined()
    expect(findBarRectAt([], 3)).toBeUndefined()
  })
})

describe('padAnchorsByHalfStep', () => {
  it('adds an anchor half the neighbouring step past each end', () => {
    expect(padAnchorsByHalfStep(anchors)).toEqual([{ time: -5, x: -5 }, ...anchors, { time: 45, x: 45 }])
  })

  it('keeps the newest volume a candle covers instead of clipping it at the last candle', () => {
    // Hourly volume under 20s "candles": the bucket at 42 sits in the last candle's right half.
    const bars = [
      { time: 38, value: 5 },
      { time: 42, value: 5 },
    ]
    expect(getVolumeBarRects({ bars, anchors, maxHeight: 10 }).map(({ time }) => time)).toEqual([38])
    expect(
      getVolumeBarRects({ bars, anchors: padAnchorsByHalfStep(anchors), maxHeight: 10 }).map(({ time }) => time),
    ).toEqual([38, 42])
  })
})
