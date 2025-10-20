import { getDurationRemainingString } from 'utilities/src/time/duration'
import { ONE_DAY_MS, ONE_HOUR_MS, ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

describe('getDurationRemainingString', () => {
  describe('future timestamps', () => {
    it('should include d for durations >= 1 day', () => {
      expect(getDurationRemainingString(Date.now() + ONE_DAY_MS * 2)).toContain('d')
    })
    it('should include h for durations > 1hr', () => {
      expect(getDurationRemainingString(Date.now() + ONE_DAY_MS)).toContain('h')
    })
    it('should not include h for durations < 1hr', () => {
      expect(getDurationRemainingString(Date.now() + ONE_MINUTE_MS)).not.toContain('h')
    })
    it('should not include m for durations < 1m', () => {
      expect(getDurationRemainingString(Date.now() + ONE_SECOND_MS * 30)).not.toContain('m')
    })

    // Test exact boundary conditions
    it('should format exactly 1 minute as "1m 0s"', () => {
      const result = getDurationRemainingString(Date.now() + ONE_MINUTE_MS)
      expect(result).toBe('1m 0s')
    })

    it('should format exactly 1 hour as "1h 0m 0s"', () => {
      const result = getDurationRemainingString(Date.now() + ONE_HOUR_MS)
      expect(result).toBe('1h 0m 0s')
    })

    it('should format exactly 1 day as "1d 0h 0m"', () => {
      const result = getDurationRemainingString(Date.now() + ONE_DAY_MS)
      expect(result).toBe('1d 0h 0m')
    })
  })

  describe('past timestamps', () => {
    it('should include "ago" for past timestamps', () => {
      expect(getDurationRemainingString(Date.now() - ONE_HOUR_MS)).toContain('ago')
    })
    it('should format days ago correctly', () => {
      const result = getDurationRemainingString(Date.now() - ONE_DAY_MS * 2)
      expect(result).toContain('d')
      expect(result).toContain('ago')
    })
    it('should format hours ago correctly', () => {
      const result = getDurationRemainingString(Date.now() - ONE_HOUR_MS * 3)
      expect(result).toContain('h')
      expect(result).toContain('ago')
      expect(result).not.toContain('d')
    })
    it('should format minutes ago correctly', () => {
      const result = getDurationRemainingString(Date.now() - ONE_MINUTE_MS * 45)
      expect(result).toContain('m')
      expect(result).toContain('ago')
      expect(result).not.toContain('h')
    })
    it('should format seconds ago correctly', () => {
      const result = getDurationRemainingString(Date.now() - ONE_SECOND_MS * 30)
      expect(result).toContain('s')
      expect(result).toContain('ago')
      expect(result).not.toContain('m')
    })

    // Test exact boundary conditions for past timestamps
    it('should format exactly 1 minute ago as "1m 0s ago"', () => {
      const result = getDurationRemainingString(Date.now() - ONE_MINUTE_MS)
      expect(result).toBe('1m 0s ago')
    })

    it('should format exactly 1 hour ago as "1h 0m 0s ago"', () => {
      const result = getDurationRemainingString(Date.now() - ONE_HOUR_MS)
      expect(result).toBe('1h 0m 0s ago')
    })

    it('should format exactly 1 day ago as "1d 0h 0m ago"', () => {
      const result = getDurationRemainingString(Date.now() - ONE_DAY_MS)
      expect(result).toBe('1d 0h 0m ago')
    })
  })
})
