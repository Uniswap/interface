import { getTooltipPosition } from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/utils/getTooltipPosition'

// PDP liquidity chart dimensions: 356px tall with a 104px header inset.
const BASE = {
  tooltipWidth: 160,
  tooltipHeight: 80,
  chartWidth: 500,
  chartHeight: 356,
  topInset: 104,
}

describe('getTooltipPosition', () => {
  it('places the tooltip to the right of and above the cursor', () => {
    expect(getTooltipPosition({ ...BASE, hoveredX: 100, hoveredY: 200 })).toEqual({ x: 112, y: 188 })
  })

  it('keeps the tooltip below the header inset when hovering near the top of the chart', () => {
    expect(getTooltipPosition({ ...BASE, hoveredX: 100, hoveredY: 40 })).toEqual({ x: 112, y: 104 })
    expect(getTooltipPosition({ ...BASE, hoveredX: 100, hoveredY: 0 })).toEqual({ x: 112, y: 104 })
  })

  it('clamps to the top of the chart when there is no inset', () => {
    expect(getTooltipPosition({ ...BASE, topInset: 0, hoveredX: 100, hoveredY: 5 })).toEqual({ x: 112, y: 0 })
  })

  it('flips to the left of the cursor when it would overflow the right edge', () => {
    expect(getTooltipPosition({ ...BASE, hoveredX: 400, hoveredY: 200 })).toEqual({ x: 228, y: 188 })
  })

  it('never goes past the left edge', () => {
    expect(getTooltipPosition({ ...BASE, chartWidth: 150, hoveredX: 50, hoveredY: 200 })).toEqual({ x: 0, y: 188 })
  })

  it('clamps to the bottom edge', () => {
    expect(getTooltipPosition({ ...BASE, hoveredX: 100, hoveredY: 350 })).toEqual({ x: 112, y: 276 })
  })

  it('prefers the header inset over the bottom edge when the chart is too short for both', () => {
    expect(getTooltipPosition({ ...BASE, chartHeight: 150, hoveredX: 100, hoveredY: 140 })).toEqual({ x: 112, y: 104 })
  })
})
