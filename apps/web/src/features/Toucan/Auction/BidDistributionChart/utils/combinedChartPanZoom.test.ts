import {
  applyPanZoom,
  computeNoBidsViewRange,
} from '~/features/Toucan/Auction/BidDistributionChart/utils/combinedChartPanZoom'

/** Fraction of the view height (from the bottom) at which a price sits */
const heightFraction = (price: number, view: { yMin: number; yMax: number }): number =>
  (price - view.yMin) / (view.yMax - view.yMin)

describe('computeNoBidsViewRange', () => {
  it('anchors the floor price at ~20% of the chart height', () => {
    const floorPrice = 0.05
    const range = computeNoBidsViewRange(floorPrice)

    expect(range).not.toBeNull()
    expect(heightFraction(floorPrice, range!)).toBeCloseTo(0.2, 10)
  })

  it('keeps the whole window positive with headroom above the floor', () => {
    const range = computeNoBidsViewRange(100)

    expect(range).not.toBeNull()
    expect(range!.yMin).toBeGreaterThan(0)
    expect(range!.yMin).toBeLessThan(100)
    expect(range!.yMax).toBeGreaterThan(100)
  })

  it('returns null for invalid floor prices', () => {
    expect(computeNoBidsViewRange(0)).toBeNull()
    expect(computeNoBidsViewRange(-1)).toBeNull()
    expect(computeNoBidsViewRange(NaN)).toBeNull()
    expect(computeNoBidsViewRange(Infinity)).toBeNull()
  })
})

describe('applyPanZoom with noBidsFloorPrice', () => {
  // Flat price series at the floor — what normalizeClearingSeries produces with zero bids
  // (yMin/yMax get a symmetric 20% buffer around the flat value)
  const floorPrice = 0.05
  const flatNormalizedData = {
    yMin: floorPrice * 0.8,
    yMax: floorPrice * 1.2,
    scaleFactor: 10_000,
  }

  it('positions the floor price at ~20% of the chart height at default zoom', () => {
    const view = applyPanZoom({
      normalizedData: flatNormalizedData,
      concentration: null,
      bars: [],
      yPanOffset: 0,
      yZoomLevel: 1,
      noBidsFloorPrice: floorPrice,
    })

    expect(heightFraction(floorPrice, view)).toBeCloseTo(0.2, 10)
    expect(view.scaledYMin).toBeCloseTo(view.yMin * flatNormalizedData.scaleFactor, 10)
    expect(view.scaledYMax).toBeCloseTo(view.yMax * flatNormalizedData.scaleFactor, 10)
  })

  it('keeps the floor line centered around the same window when zooming', () => {
    const defaultView = applyPanZoom({
      normalizedData: flatNormalizedData,
      concentration: null,
      bars: [],
      yPanOffset: 0,
      yZoomLevel: 1,
      noBidsFloorPrice: floorPrice,
    })
    const zoomedView = applyPanZoom({
      normalizedData: flatNormalizedData,
      concentration: null,
      bars: [],
      yPanOffset: 0,
      yZoomLevel: 2,
      noBidsFloorPrice: floorPrice,
    })

    // Zooming halves the visible range around the same midpoint
    const defaultRange = defaultView.yMax - defaultView.yMin
    const zoomedRange = zoomedView.yMax - zoomedView.yMin
    expect(zoomedRange).toBeCloseTo(defaultRange / 2, 10)
    expect((zoomedView.yMin + zoomedView.yMax) / 2).toBeCloseTo((defaultView.yMin + defaultView.yMax) / 2, 10)
  })

  it('applies pan offset on top of the no-bids window', () => {
    const view = applyPanZoom({
      normalizedData: flatNormalizedData,
      concentration: null,
      bars: [],
      yPanOffset: 0.01,
      yZoomLevel: 1,
      noBidsFloorPrice: floorPrice,
    })

    // Panning up by 0.01 lowers the floor's relative position in the window
    expect(heightFraction(floorPrice, view)).toBeLessThan(0.2)
  })

  it('falls back to the default buffered window when noBidsFloorPrice is omitted', () => {
    const view = applyPanZoom({
      normalizedData: flatNormalizedData,
      concentration: null,
      bars: [],
      yPanOffset: 0,
      yZoomLevel: 1,
    })

    // Flat series without the anchor stays vertically centered
    expect(heightFraction(floorPrice, view)).toBeCloseTo(0.5, 10)
  })

  it('ignores an invalid noBidsFloorPrice', () => {
    const view = applyPanZoom({
      normalizedData: flatNormalizedData,
      concentration: null,
      bars: [],
      yPanOffset: 0,
      yZoomLevel: 1,
      noBidsFloorPrice: 0,
    })

    expect(heightFraction(floorPrice, view)).toBeCloseTo(0.5, 10)
  })
})
