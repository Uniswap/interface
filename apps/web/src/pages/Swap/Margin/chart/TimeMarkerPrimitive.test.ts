import type { IChartApi, ISeriesApi, SeriesAttachedParameter, SeriesOptionsMap, Time } from 'lightweight-charts'
import { describe, expect, it } from 'vitest'
import { TimeMarkerPrimitive, type TimeMarker } from '~/pages/Swap/Margin/chart/TimeMarkerPrimitive'

const COLORS = { open: '#0f0', decrease: '#f00', ring: '#fff' }

// The pane view holds a MarkerViewData the renderer reads; only its shape matters here.
type Points = Array<{ x: number; y: number; kind: 'open' | 'decrease' }>

/**
 * Attaches the primitive to a chart/series pair whose coordinate lookups are driven by the maps below,
 * so a test can put a marker off-screen by omitting its time or price.
 */
function attach({ xByTime, yByPrice }: { xByTime: Map<number, number | null>; yByPrice: Map<number, number | null> }): {
  primitive: TimeMarkerPrimitive
  points: () => Points
} {
  const primitive = new TimeMarkerPrimitive()
  const chart = {
    timeScale: () => ({ timeToCoordinate: (time: Time) => xByTime.get(Number(time)) ?? null }),
  } as unknown as IChartApi
  const series = {
    subscribeDataChanged: () => undefined,
    unsubscribeDataChanged: () => undefined,
    priceToCoordinate: (price: number) => yByPrice.get(price) ?? null,
  } as unknown as ISeriesApi<keyof SeriesOptionsMap>

  primitive.attached({ chart, series, requestUpdate: () => undefined } as SeriesAttachedParameter<Time>)
  const view = primitive.paneViews().at(0)
  if (!view) {
    throw new Error('no pane view')
  }
  return {
    primitive,
    points: () => (view as unknown as { data: { points: Points } }).data.points,
  }
}

const marker = (time: number, price: number, kind: 'open' | 'decrease' = 'open'): TimeMarker =>
  ({ time, price, kind }) as unknown as TimeMarker

describe('TimeMarkerPrimitive pane view', () => {
  it('resolves each marker to its media-space coordinates', () => {
    const { primitive, points } = attach({
      xByTime: new Map([
        [10, 100],
        [20, 200],
      ]),
      yByPrice: new Map([
        [1, 11],
        [2, 22],
      ]),
    })
    primitive.update({ markers: [marker(10, 1), marker(20, 2, 'decrease')], colors: COLORS })
    primitive.updateAllViews()

    expect(points()).toEqual([
      { x: 100, y: 11, kind: 'open' },
      { x: 200, y: 22, kind: 'decrease' },
    ])
  })

  it('culls a marker the chart cannot place', () => {
    const { primitive, points } = attach({
      xByTime: new Map([
        [10, 100],
        [20, null],
      ]),
      yByPrice: new Map([
        [1, 11],
        [2, 22],
      ]),
    })
    primitive.update({ markers: [marker(10, 1), marker(20, 2)], colors: COLORS })
    primitive.updateAllViews()

    expect(points()).toEqual([{ x: 100, y: 11, kind: 'open' }])
  })

  // The view rewrites its points array IN PLACE across repaints, so a shrinking marker set has to
  // truncate — reusing slots without it would leave the previous frame's markers drawn forever.
  it('drops stale points when the marker set shrinks', () => {
    const { primitive, points } = attach({
      xByTime: new Map([
        [10, 100],
        [20, 200],
      ]),
      yByPrice: new Map([
        [1, 11],
        [2, 22],
      ]),
    })
    primitive.update({ markers: [marker(10, 1), marker(20, 2)], colors: COLORS })
    primitive.updateAllViews()
    expect(points()).toHaveLength(2)

    primitive.update({ markers: [marker(20, 2, 'decrease')], colors: COLORS })
    primitive.updateAllViews()
    expect(points()).toEqual([{ x: 200, y: 22, kind: 'decrease' }])
  })
})
