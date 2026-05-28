import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('env', () => {
  const originalEnv = process.env

  // Helper function to mock the platform module
  const mockPlatform = (config: { isWebApp?: boolean; isExtensionApp?: boolean } = {}): void => {
    vi.doMock('../platform', () => ({
      isWebApp: config.isWebApp ?? false,
      isExtensionApp: config.isExtensionApp ?? false,
    }))
  }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('isTestEnv', () => {
    it('should return true', async () => {
      process.env.NODE_ENV = 'test'

      mockPlatform()

      const { isTestEnv } = await import('./env.web')
      expect(isTestEnv()).toBe(true)
    })
  })

  describe('isE2eTestEnv', () => {
    it('should return false when IS_E2E_TEST is not set', async () => {
      mockPlatform()

      const { isE2eTestEnv } = await import('./env.web')
      expect(isE2eTestEnv()).toBe(false)
    })

    it('should return true when IS_E2E_TEST is set', async () => {
      process.env.IS_E2E_TEST = 'true'

      mockPlatform()

      const { isE2eTestEnv } = await import('./env.web')
      expect(isE2eTestEnv()).toBe(true)
    })
  })

  describe('isDevEnv', () => {
    it('should return false', async () => {
      mockPlatform()

      const { isDevEnv } = await import('./env.web')
      expect(isDevEnv()).toBe(false)
    })

    it('should return true', async () => {
      process.env.NODE_ENV = 'development'
      const originalVitestId = process.env.VITEST_WORKER_ID
      delete process.env.VITEST_WORKER_ID
      delete process.env.JEST_WORKER_ID

      mockPlatform({ isWebApp: true })

      const { isDevEnv } = await import('./env.web')
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

      const { isBetaEnv } = await import('./env.web')
      expect(isBetaEnv()).toBe(false)
    })

    it('should return true', async () => {
      // Set environment BEFORE mocking and importing
      process.env.ENVIRONMENT = 'staging'
      // Temporarily remove test environment markers
      const originalVitestId = process.env.VITEST_WORKER_ID
      delete process.env.VITEST_WORKER_ID
      delete process.env.JEST_WORKER_ID

      // Mock isWebApp to return true for this test
      mockPlatform({ isWebApp: true })

      const { isBetaEnv } = await import('./env.web')
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

      const { isProdEnv } = await import('./env.web')
      expect(isProdEnv()).toBe(false)
    })

    it('should return true', async () => {
      // Set environment BEFORE mocking and importing
      process.env.NODE_ENV = 'production'
      delete process.env.ENVIRONMENT // Ensure beta env is false
      // Temporarily remove test environment markers
      const originalVitestId = process.env.VITEST_WORKER_ID
      delete process.env.VITEST_WORKER_ID
      delete process.env.JEST_WORKER_ID

      // Mock isWebApp to return true for this test
      mockPlatform({ isWebApp: true })

      const { isProdEnv } = await import('./env.web')
      const result = isProdEnv()

      // Restore original env
      if (originalVitestId) {
        process.env.VITEST_WORKER_ID = originalVitestId
      }

      expect(result).toBe(true)
    })
  })

  describe('localDevDatadogEnabled', () => {
    it('should be false — do not commit as true', async () => {
      mockPlatform()

      const { localDevDatadogEnabled } = await import('./env.web')
      expect(localDevDatadogEnabled).toBe(false)
    })
  })

  describe('isDatadogEnabled', () => {
    it('should return false in unit tests', async () => {
      mockPlatform()

      const { isDatadogEnabled } = await import('./env.web')
      expect(isDatadogEnabled()).toBe(false)
    })

    it('should return false in e2e tests', async () => {
      process.env.IS_E2E_TEST = 'true'
      const originalVitestId = process.env.VITEST_WORKER_ID
      delete process.env.VITEST_WORKER_ID
      delete process.env.JEST_WORKER_ID

      mockPlatform()

      const { isDatadogEnabled } = await import('./env.web')
      const result = isDatadogEnabled()

      if (originalVitestId) {
        process.env.VITEST_WORKER_ID = originalVitestId
      }

      expect(result).toBe(false)
    })

    it('should return true in non-test environments', async () => {
      process.env.NODE_ENV = 'production'
      const originalVitestId = process.env.VITEST_WORKER_ID
      delete process.env.VITEST_WORKER_ID
      delete process.env.JEST_WORKER_ID

      mockPlatform()

      const { isDatadogEnabled } = await import('./env.web')
      const result = isDatadogEnabled()

      if (originalVitestId) {
        process.env.VITEST_WORKER_ID = originalVitestId
      }

      expect(result).toBe(true)
    })
  })
})
