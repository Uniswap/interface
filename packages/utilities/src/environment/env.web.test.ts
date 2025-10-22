import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('env', () => {
  const originalEnv = process.env

  // Helper function to mock the platform module
  const mockPlatform = (config: { isWebApp?: boolean; isExtensionApp?: boolean } = {}): void => {
    vi.doMock('utilities/src/platform', () => ({
      isWebApp: config.isWebApp ?? false,
      isExtensionApp: config.isExtensionApp ?? false,
    }))
  }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    if ('__playwright__binding__' in window) {
      delete (window as any).__playwright__binding__
    }
    process.env = originalEnv
  })

  describe('isTestEnv', () => {
    it('should return true', async () => {
      process.env.NODE_ENV = 'test'

      mockPlatform()

      const { isTestEnv } = await import('utilities/src/environment/env.web')
      expect(isTestEnv()).toBe(true)
    })
  })

  describe('isPlaywrightEnv', () => {
    it('should return false', async () => {
      mockPlatform()

      const { isPlaywrightEnv } = await import('utilities/src/environment/env.web')
      expect(isPlaywrightEnv()).toBe(false)
    })

    it('should return true', async () => {
      // eslint-disable-next-line no-extra-semi
      ;(globalThis as any).__playwright__binding__ = {}

      ;(window as any).__playwright__binding__ = {}

      mockPlatform()

      const { isPlaywrightEnv } = await import('utilities/src/environment/env.web')

      const result = isPlaywrightEnv()

      delete (globalThis as any).__playwright__binding__

      delete (window as any).__playwright__binding__

      expect(result).toBe(true)
    })
  })

  describe('isDevEnv', () => {
    it('should return false', async () => {
      mockPlatform()

      const { isDevEnv } = await import('utilities/src/environment/env.web')
      expect(isDevEnv()).toBe(false)
    })

    it('should return true', async () => {
      process.env.NODE_ENV = 'development'
      const originalVitestId = process.env.VITEST_WORKER_ID
      delete process.env.VITEST_WORKER_ID
      delete process.env.JEST_WORKER_ID

      mockPlatform({ isWebApp: true })

      const { isDevEnv } = await import('utilities/src/environment/env.web')
      const result = isDevEnv()

      if (originalVitestId) {
        process.env.VITEST_WORKER_ID = originalVitestId
      }

      expect(result).toBe(true)
    })
  })

  describe('isBetaEnv', () => {
    it('should return false', async () => {
      mockPlatform()

      const { isBetaEnv } = await import('utilities/src/environment/env.web')
      expect(isBetaEnv()).toBe(false)
    })

    it('should return true', async () => {
      // Set environment BEFORE mocking and importing
      process.env.REACT_APP_STAGING = 'true'
      // Temporarily remove test environment markers
      const originalVitestId = process.env.VITEST_WORKER_ID
      delete process.env.VITEST_WORKER_ID
      delete process.env.JEST_WORKER_ID

      // Mock isWebApp to return true for this test
      mockPlatform({ isWebApp: true })

      const { isBetaEnv } = await import('utilities/src/environment/env.web')
      const result = isBetaEnv()

      // Restore original env
      if (originalVitestId) {
        process.env.VITEST_WORKER_ID = originalVitestId
      }

      expect(result).toBe(true)
    })
  })

  describe('isProdEnv', () => {
    it('should return false', async () => {
      mockPlatform()

      const { isProdEnv } = await import('utilities/src/environment/env.web')
      expect(isProdEnv()).toBe(false)
    })

    it('should return true', async () => {
      // Set environment BEFORE mocking and importing
      process.env.NODE_ENV = 'production'
      delete process.env.REACT_APP_STAGING // Ensure beta env is false
      // Temporarily remove test environment markers
      const originalVitestId = process.env.VITEST_WORKER_ID
      delete process.env.VITEST_WORKER_ID
      delete process.env.JEST_WORKER_ID

      // Mock isWebApp to return true for this test
      mockPlatform({ isWebApp: true })

      const { isProdEnv } = await import('utilities/src/environment/env.web')
      const result = isProdEnv()

      // Restore original env
      if (originalVitestId) {
        process.env.VITEST_WORKER_ID = originalVitestId
      }

      expect(result).toBe(true)
    })
  })
})
