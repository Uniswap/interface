/* biome-ignore-all lint/style/noRestrictedGlobals: we need access to `chrome` in the global scope */
import {
  getChrome,
  getChromeRuntime,
  getChromeRuntimeWithThrow,
  getChromeWithThrow,
} from 'utilities/src/chrome/chrome.web'

describe('Chrome utilities', () => {
  const originalChrome = global.chrome

  beforeEach(() => {
    // Reset the global chrome object before each test
    vi.resetAllMocks()
  })

  afterAll(() => {
    // Restore the original chrome object after all tests
    global.chrome = originalChrome
  })

  describe('getChrome', () => {
    it('should return chrome object when chrome is available', () => {
      // Arrange
      const mockChrome = { runtime: { id: 'test-id' } }
      global.chrome = mockChrome as typeof chrome

      // Act
      const result = getChrome()

      // Assert
      expect(result).toBe(mockChrome)
    })

    it('should return undefined when chrome is not available', () => {
      // Arrange
      // @ts-expect-error - we're intentionally setting chrome to undefined for testing
      global.chrome = undefined

      // Act
      const result = getChrome()

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('getChromeWithThrow', () => {
    it('should return chrome object when chrome is available', () => {
      // Arrange
      const mockChrome = { runtime: { id: 'test-id' } }
      global.chrome = mockChrome as typeof chrome

      // Act
      const result = getChromeWithThrow()

      // Assert
      expect(result).toBe(mockChrome)
    })

    it('should throw error when chrome is not available', () => {
      // Arrange
      // @ts-expect-error - we're intentionally setting chrome to undefined for testing
      global.chrome = undefined

      // Act & Assert
      expect(() => getChromeWithThrow()).toThrow('`chrome` is not available in this context')
    })
  })

  describe('getChromeRuntime', () => {
    it('should return chrome.runtime when available', () => {
      // Arrange
      const mockRuntime = { id: 'test-id' }
      global.chrome = { runtime: mockRuntime } as typeof chrome

      // Act
      const result = getChromeRuntime()

      // Assert
      expect(result).toBe(mockRuntime)
    })

    it('should return undefined when chrome is not available', () => {
      // Arrange
      // @ts-expect-error - we're intentionally setting chrome to undefined for testing
      global.chrome = undefined

      // Act
      const result = getChromeRuntime()

      // Assert
      expect(result).toBeUndefined()
    })

    it('should return undefined when chrome.runtime is not available', () => {
      // Arrange
      global.chrome = {} as typeof chrome

      // Act
      const result = getChromeRuntime()

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('getChromeRuntimeWithThrow', () => {
    it('should return chrome.runtime when available', () => {
      // Arrange
      const mockRuntime = { id: 'test-id' }
      global.chrome = { runtime: mockRuntime } as typeof chrome

      // Act
      const result = getChromeRuntimeWithThrow()

      // Assert
      expect(result).toBe(mockRuntime)
    })

    it('should throw error when chrome is not available', () => {
      // Arrange
      // @ts-expect-error - we're intentionally setting chrome to undefined for testing
      global.chrome = undefined

      // Act & Assert
      expect(() => getChromeRuntimeWithThrow()).toThrow('`chrome.runtime` is not available in this context')
    })

    it('should throw error when chrome.runtime is not available', () => {
      // Arrange
      global.chrome = {} as typeof chrome

      // Act & Assert
      expect(() => getChromeRuntimeWithThrow()).toThrow('`chrome.runtime` is not available in this context')
    })
  })
})
