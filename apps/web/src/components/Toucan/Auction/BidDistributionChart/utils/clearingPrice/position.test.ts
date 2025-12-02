import { COORDINATE_SCALING } from 'components/Toucan/Auction/BidDistributionChart/constants'
import { findClearingPriceXPosition } from 'components/Toucan/Auction/BidDistributionChart/utils/clearingPrice/position'

describe('findClearingPriceXPosition', () => {
  describe('exact position match', () => {
    it('returns bar center when clearing price exactly matches bar tick value', () => {
      const bars = [
        { tickValue: 1.0, column: { left: 10, right: 20 } },
        { tickValue: 2.0, column: { left: 30, right: 40 } },
      ]

      const result = findClearingPriceXPosition({
        clearingPrice: 1.0,
        bars,
      })

      expect(result).toBe(15) // (10 + 20) / 2
    })

    it('returns bar center when clearing price is within tolerance of bar', () => {
      const bars = [{ tickValue: 1.0, column: { left: 10, right: 20 } }]

      // Clearing price very close to 1.0 (within default tolerance of 1 scaled unit)
      const scaleFactor = COORDINATE_SCALING.PRICE_SCALE_FACTOR
      const almostOne = (scaleFactor - 0.5) / scaleFactor

      const result = findClearingPriceXPosition({
        clearingPrice: almostOne,
        bars,
      })

      expect(result).toBe(15) // Should match despite slight difference
    })

    it('uses custom position tolerance when provided', () => {
      const bars = [{ tickValue: 1.0, column: { left: 10, right: 20 } }]

      // With larger tolerance, should match
      const result1 = findClearingPriceXPosition({
        clearingPrice: 1.01,
        bars,
        positionTolerance: 150, // Increased tolerance
      })
      expect(result1).toBe(15)

      // With stricter tolerance, should not match
      const result2 = findClearingPriceXPosition({
        clearingPrice: 1.01,
        bars,
        positionTolerance: 0.1, // Very strict tolerance
      })
      expect(result2).toBeNull()
    })
  })

  describe('interpolation between bars', () => {
    it('interpolates position when clearing price falls between two bars', () => {
      const bars = [
        { tickValue: 1.0, column: { left: 10, right: 20 } }, // center: 15
        { tickValue: 2.0, column: { left: 30, right: 40 } }, // center: 35
      ]

      // Clearing price exactly halfway between bars
      const result = findClearingPriceXPosition({
        clearingPrice: 1.5,
        bars,
      })

      expect(result).toBe(25) // Halfway between 15 and 35
    })

    it('interpolates correctly at 25% ratio', () => {
      const bars = [
        { tickValue: 1.0, column: { left: 0, right: 10 } }, // center: 5
        { tickValue: 2.0, column: { left: 20, right: 30 } }, // center: 25
      ]

      // Clearing price 25% of the way from 1.0 to 2.0
      const result = findClearingPriceXPosition({
        clearingPrice: 1.25,
        bars,
      })

      expect(result).toBe(10) // 5 + 0.25 * (25 - 5) = 10
    })

    it('interpolates correctly at 75% ratio', () => {
      const bars = [
        { tickValue: 1.0, column: { left: 0, right: 10 } }, // center: 5
        { tickValue: 2.0, column: { left: 20, right: 30 } }, // center: 25
      ]

      // Clearing price 75% of the way from 1.0 to 2.0
      const result = findClearingPriceXPosition({
        clearingPrice: 1.75,
        bars,
      })

      expect(result).toBe(20) // 5 + 0.75 * (25 - 5) = 20
    })

    it('handles non-uniform bar spacing', () => {
      const bars = [
        { tickValue: 1.0, column: { left: 0, right: 5 } }, // center: 2.5
        { tickValue: 3.0, column: { left: 100, right: 120 } }, // center: 110
      ]

      // Clearing price exactly halfway (2.0) between 1.0 and 3.0
      const result = findClearingPriceXPosition({
        clearingPrice: 2.0,
        bars,
      })

      expect(result).toBe(56.25) // 2.5 + 0.5 * (110 - 2.5) = 56.25
    })
  })

  describe('edge cases', () => {
    it('returns null when bars array is empty', () => {
      const result = findClearingPriceXPosition({
        clearingPrice: 1.5,
        bars: [],
      })

      expect(result).toBeNull()
    })

    it('returns null when no bars have column data', () => {
      const bars = [{ tickValue: 1.0 }, { tickValue: 2.0 }]

      const result = findClearingPriceXPosition({
        clearingPrice: 1.5,
        bars,
      })

      expect(result).toBeNull()
    })

    it('returns null when clearing price is below all bars', () => {
      const bars = [
        { tickValue: 2.0, column: { left: 20, right: 30 } },
        { tickValue: 3.0, column: { left: 40, right: 50 } },
      ]

      const result = findClearingPriceXPosition({
        clearingPrice: 1.0, // Below all bars
        bars,
      })

      expect(result).toBeNull()
    })

    it('returns null when clearing price is above all bars', () => {
      const bars = [
        { tickValue: 1.0, column: { left: 10, right: 20 } },
        { tickValue: 2.0, column: { left: 30, right: 40 } },
      ]

      const result = findClearingPriceXPosition({
        clearingPrice: 3.0, // Above all bars
        bars,
      })

      expect(result).toBeNull()
    })

    it('skips bars without column data and continues searching', () => {
      const bars = [
        { tickValue: 1.0 }, // No column
        { tickValue: 1.5, column: { left: 10, right: 20 } },
        { tickValue: 2.0, column: { left: 30, right: 40 } },
      ]

      const result = findClearingPriceXPosition({
        clearingPrice: 1.75,
        bars,
      })

      // Should interpolate between second and third bars (skipping first)
      expect(result).toBe(25) // Halfway between 15 and 35
    })

    it('handles single bar with exact match', () => {
      const bars = [{ tickValue: 1.5, column: { left: 10, right: 20 } }]

      const result = findClearingPriceXPosition({
        clearingPrice: 1.5,
        bars,
      })

      expect(result).toBe(15)
    })

    it('handles single bar without match', () => {
      const bars = [{ tickValue: 1.0, column: { left: 10, right: 20 } }]

      const result = findClearingPriceXPosition({
        clearingPrice: 2.0,
        bars,
      })

      expect(result).toBeNull()
    })
  })

  describe('precision and rounding', () => {
    it('handles decimal tick values correctly', () => {
      const bars = [
        { tickValue: 1.123, column: { left: 10, right: 20 } },
        { tickValue: 1.456, column: { left: 30, right: 40 } },
      ]

      const result = findClearingPriceXPosition({
        clearingPrice: 1.2895, // Midpoint
        bars,
      })

      expect(result).toBeCloseTo(25, 1) // Should be approximately halfway
    })

    it('handles very small tick differences', () => {
      const bars = [
        { tickValue: 0.0001, column: { left: 10, right: 20 } },
        { tickValue: 0.0002, column: { left: 30, right: 40 } },
      ]

      const result = findClearingPriceXPosition({
        clearingPrice: 0.00015,
        bars,
      })

      // Note: Scale factor (10000) causes rounding. 0.00015 * 10000 = 1.5 → rounds to 2
      // This matches bar1 (0.0001 * 10000 = 1), so returns bar1 center
      expect(result).toBe(15)
    })

    it('handles large tick values', () => {
      const bars = [
        { tickValue: 1000000, column: { left: 10, right: 20 } },
        { tickValue: 2000000, column: { left: 30, right: 40 } },
      ]

      const result = findClearingPriceXPosition({
        clearingPrice: 1500000,
        bars,
      })

      expect(result).toBe(25) // Halfway
    })
  })

  describe('real-world scenarios', () => {
    it('handles typical auction bid distribution with multiple bars', () => {
      // Simulating a real auction with 5 price points
      const bars = [
        { tickValue: 1.0, column: { left: 0, right: 10 } },
        { tickValue: 1.25, column: { left: 15, right: 25 } },
        { tickValue: 1.5, column: { left: 30, right: 40 } }, // Clearing price near here
        { tickValue: 1.75, column: { left: 45, right: 55 } },
        { tickValue: 2.0, column: { left: 60, right: 70 } },
      ]

      // Clearing price slightly above 1.5
      const result = findClearingPriceXPosition({
        clearingPrice: 1.6,
        bars,
      })

      // Should interpolate between bars at 1.5 and 1.75
      // Bar centers: 35 and 50
      // Ratio: (1.6 - 1.5) / (1.75 - 1.5) = 0.1 / 0.25 = 0.4
      // Result: 35 + 0.4 * (50 - 35) = 41
      expect(result).toBe(41)
    })

    it('handles bars with varying widths', () => {
      const bars = [
        { tickValue: 1.0, column: { left: 0, right: 5 } }, // Narrow bar
        { tickValue: 2.0, column: { left: 10, right: 30 } }, // Wide bar
      ]

      const result = findClearingPriceXPosition({
        clearingPrice: 1.5,
        bars,
      })

      // Centers: 2.5 and 20
      // Halfway: 2.5 + 0.5 * (20 - 2.5) = 11.25
      expect(result).toBe(11.25)
    })
  })
})
