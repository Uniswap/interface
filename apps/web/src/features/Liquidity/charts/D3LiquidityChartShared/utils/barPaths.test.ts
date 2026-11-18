import { buildBarPathsByOpacity } from '~/features/Liquidity/charts/D3LiquidityChartShared/utils/barPaths'

describe('buildBarPathsByOpacity', () => {
  it('draws the bars of each opacity as one path, skipping empty and missing rects', () => {
    const bars = [
      { id: 1, opacity: 0.8 },
      { id: 2, opacity: 0.2 },
      { id: 3, opacity: 0.8 },
      { id: 4, opacity: 0.8 },
      { id: 5, opacity: 0.2 },
    ]
    const paths = buildBarPathsByOpacity({
      bars,
      getOpacity: (bar) => bar.opacity,
      getRect: (bar) =>
        bar.id === 4
          ? { x: 0, y: 0, width: 0, height: 1 }
          : bar.id === 5
            ? undefined
            : { x: 1, y: bar.id, width: 2.004, height: 1 },
    })
    expect(paths).toEqual([
      { opacity: 0.8, d: 'M1,1h2v1h-2ZM1,3h2v1h-2Z' },
      { opacity: 0.2, d: 'M1,2h2v1h-2Z' },
    ])
  })
})
