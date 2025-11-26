import {
  BASE_Z_INDEX,
  calculateStackingProps,
  MAX_STACKED_BANNERS,
  SCALE_DECREMENT,
  VERTICAL_OFFSET,
} from 'notification-service/notification-renderer/stackingUtils'

describe('stackingUtils', () => {
  describe('calculateStackingProps', () => {
    it('calculates correct props for only notification (index 0, total 1)', () => {
      const props = calculateStackingProps(0, 1)

      expect(props).toEqual({
        scale: 1, // No scale reduction when only one notification
        offsetY: 0, // No offset when only one notification
        zIndex: BASE_Z_INDEX + MAX_STACKED_BANNERS, // Highest z-index
      })
    })

    it('calculates correct props for bottom notification in reversed array (index 0, total 3)', () => {
      // In the component, notifications are reversed before mapping
      // So index 0 = oldest notification = bottom of visual stack
      const props = calculateStackingProps(0, 3)

      expect(props).toEqual({
        scale: 1 - 2 * SCALE_DECREMENT, // 90% scale (bottom has smallest scale)
        offsetY: 2 * VERTICAL_OFFSET, // Most offset (bottom)
        zIndex: BASE_Z_INDEX + MAX_STACKED_BANNERS - 2, // Lowest z-index
      })
    })

    it('calculates correct props for middle notification (index 1, total 3)', () => {
      const props = calculateStackingProps(1, 3)

      expect(props).toEqual({
        scale: 1 - SCALE_DECREMENT, // 95% scale
        offsetY: VERTICAL_OFFSET, // One offset unit
        zIndex: BASE_Z_INDEX + MAX_STACKED_BANNERS - 1, // Middle z-index
      })
    })

    it('calculates correct props for top notification in reversed array (index 2, total 3)', () => {
      // In the component, index 2 = newest notification = top of visual stack
      const props = calculateStackingProps(2, 3)

      expect(props).toEqual({
        scale: 1, // Full scale (top notification)
        offsetY: 0, // No offset (top)
        zIndex: BASE_Z_INDEX + MAX_STACKED_BANNERS, // Highest z-index
      })
    })

    it('calculates correct props for top notification (index 1, total 2)', () => {
      const props = calculateStackingProps(1, 2)

      expect(props).toEqual({
        scale: 1, // Full scale for top
        offsetY: 0, // No offset for top
        zIndex: BASE_Z_INDEX + MAX_STACKED_BANNERS,
      })
    })

    it('maintains correct z-index ordering: higher index = higher z-index', () => {
      const props0 = calculateStackingProps(0, 3)
      const props1 = calculateStackingProps(1, 3)
      const props2 = calculateStackingProps(2, 3)

      // Higher index (top of stack) should have higher z-index
      expect(props2.zIndex).toBeGreaterThan(props1.zIndex)
      expect(props1.zIndex).toBeGreaterThan(props0.zIndex)
    })

    it('maintains correct scale ordering: higher index = larger scale', () => {
      const props0 = calculateStackingProps(0, 3)
      const props1 = calculateStackingProps(1, 3)
      const props2 = calculateStackingProps(2, 3)

      // Higher index (top of stack) should have larger scale
      expect(props2.scale).toBeGreaterThan(props1.scale)
      expect(props1.scale).toBeGreaterThan(props0.scale)
    })

    it('maintains correct offsetY ordering: higher index = smaller offset', () => {
      const props0 = calculateStackingProps(0, 3)
      const props1 = calculateStackingProps(1, 3)
      const props2 = calculateStackingProps(2, 3)

      // Higher index (top of stack) should have smaller offset
      expect(props2.offsetY).toBeLessThan(props1.offsetY)
      expect(props1.offsetY).toBeLessThan(props0.offsetY)
    })
  })
})
