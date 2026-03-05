import { addJitter, getDefaultJitteredDelay } from '@universe/websocket/src/utils/backoff'
import { describe, expect, it, vi } from 'vitest'

describe('backoff utilities', () => {
  describe('addJitter', () => {
    it('returns value in range [minDelay, minDelay + jitterRange]', () => {
      const minDelay = 1000
      const jitterRange = 4000

      // Run multiple times to test randomness
      for (let i = 0; i < 100; i++) {
        const result = addJitter(minDelay, jitterRange)
        expect(result).toBeGreaterThanOrEqual(minDelay)
        expect(result).toBeLessThan(minDelay + jitterRange)
      }
    })

    it('returns exact minDelay when Math.random returns 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0)

      const result = addJitter(1000, 4000)

      expect(result).toBe(1000)

      vi.restoreAllMocks()
    })

    it('returns near max when Math.random returns near 1', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999)

      const result = addJitter(1000, 4000)

      expect(result).toBeCloseTo(4996, 0)

      vi.restoreAllMocks()
    })
  })

  describe('getDefaultJitteredDelay', () => {
    it('returns value between 1000 and 5000', () => {
      for (let i = 0; i < 100; i++) {
        const result = getDefaultJitteredDelay()
        expect(result).toBeGreaterThanOrEqual(1000)
        expect(result).toBeLessThan(5000)
      }
    })
  })
})
