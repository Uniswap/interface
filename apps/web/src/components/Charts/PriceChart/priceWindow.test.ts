import { describe, expect, it } from 'vitest'
import { getRangeWindow, zoomWindow } from '~/components/Charts/PriceChart/priceWindow'

const ZOOM_FACTOR = 1.3

describe('getRangeWindow', () => {
  it('centres the range in a window three times its width', () => {
    expect(getRangeWindow({ lower: 2_000, upper: 2_200 })).toEqual({ min: 1_800, max: 2_400 })
  })

  it('has no window for a range with an open edge', () => {
    expect(getRangeWindow({ lower: 2_000 })).toBeUndefined()
    expect(getRangeWindow({ upper: 2_200 })).toBeUndefined()
  })

  it('keeps the window above zero for a wide range', () => {
    const window = getRangeWindow({ lower: 10, upper: 1_000 })
    expect(window?.min).toBeGreaterThan(0)
    expect(window?.max).toBe(1_990)
  })
})

describe('zoomWindow', () => {
  it('zooms in and out about the centre', () => {
    const zoomedIn = zoomWindow({ min: 1_800, max: 2_400 }, ZOOM_FACTOR)
    expect((zoomedIn.min + zoomedIn.max) / 2).toBeCloseTo(2_100)
    expect(zoomedIn.max - zoomedIn.min).toBeCloseTo(600 / ZOOM_FACTOR)

    const zoomedOut = zoomWindow({ min: 1_800, max: 2_400 }, 1 / ZOOM_FACTOR)
    expect(zoomedOut.max - zoomedOut.min).toBeCloseTo(600 * ZOOM_FACTOR)
  })
})
