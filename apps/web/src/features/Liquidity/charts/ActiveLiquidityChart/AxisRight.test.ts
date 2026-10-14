import { scaleLinear } from 'd3'
import { getAxisTickValues } from '~/features/Liquidity/charts/ActiveLiquidityChart/AxisRight'

const PANE_HEIGHT = 412

// The "All time" filter on an OP/WBTC v4 position: a ~0.9-1.1 range inside a 0-750 domain, which
// squashes the position's range to a fraction of a pixel of pane height.
const allTimeScale = scaleLinear().domain([0, 750]).range([PANE_HEIGHT, 0])

describe('getAxisTickValues', () => {
  it('shows one bound label when the range collapses to less than a label height', () => {
    expect(getAxisTickValues({ yScale: allTimeScale, height: PANE_HEIGHT, min: 0.9, current: 1, max: 1.1 })).toEqual([
      1.1,
    ])
  })

  it('still shows the current price when it is far from the collapsed bounds', () => {
    expect(getAxisTickValues({ yScale: allTimeScale, height: PANE_HEIGHT, min: 0.9, current: 700, max: 1.1 })).toEqual([
      700, 1.1,
    ])
  })

  it('keeps the lower bound when the upper bound is a full-range position outside the pane', () => {
    expect(
      getAxisTickValues({
        yScale: allTimeScale,
        height: PANE_HEIGHT,
        min: 0.9,
        current: 1,
        max: Number.MAX_SAFE_INTEGER,
      }),
    ).toEqual([0.9, Number.MAX_SAFE_INTEGER])
  })

  it('shows every label when the bounds are more than a label height apart', () => {
    const yScale = scaleLinear().domain([0, 2]).range([PANE_HEIGHT, 0])
    expect(getAxisTickValues({ yScale, height: PANE_HEIGHT, min: 0.5, current: 1, max: 1.5 })).toEqual([0.5, 1, 1.5])
  })
})
