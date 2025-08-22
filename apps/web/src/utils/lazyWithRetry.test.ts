import { createLazy, createLazyFactory, isDynamicImportError, lazyWithRetry } from 'utils/lazyWithRetry'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
}
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

describe('lazyWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)

    // Replace console methods with mocks
    console.log = mockConsole.log
    console.warn = mockConsole.warn
    console.error = mockConsole.error
  })

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log
    console.warn = originalConsole.warn
    console.error = originalConsole.error
  })

  describe('basic functionality', () => {
    it('should return a React lazy component', () => {
      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      const result = lazyWithRetry(mockImportFn)

      expect(result).toHaveProperty('$$typeof', Symbol.for('react.lazy'))
      expect(result).toHaveProperty('_payload')
      expect(result).toHaveProperty('_init')
    })

    it('should work with createLazy', () => {
      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      const result = createLazy(mockImportFn)

      expect(result).toHaveProperty('$$typeof', Symbol.for('react.lazy'))
    })

    it('should work with createLazyFactory', () => {
      const customFactory = createLazyFactory({
        maxRetries: 5,
        baseDelay: 2000,
        refreshOnFinalFailure: false,
      })

      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })
      const result = customFactory(mockImportFn)

      expect(result).toHaveProperty('$$typeof', Symbol.for('react.lazy'))
    })
  })

  describe('error detection logic', () => {
    describe('case sensitivity handling', () => {
      it('should detect dynamic import errors with various case combinations in error message', () => {
        const testCases = [
          // Lowercase
          { message: 'failed to fetch dynamically imported module', expected: true },
          { message: 'loading chunk failed', expected: true },
          { message: 'loading css chunk failed', expected: true },
          { message: 'networkerror when attempting to fetch resource', expected: true },

          // Uppercase
          { message: 'FAILED TO FETCH DYNAMICALLY IMPORTED MODULE', expected: true },
          { message: 'LOADING CHUNK FAILED', expected: true },
          { message: 'LOADING CSS CHUNK FAILED', expected: true },
          { message: 'NETWORKERROR WHEN ATTEMPTING TO FETCH RESOURCE', expected: true },

          // Mixed case
          { message: 'Failed To Fetch Dynamically Imported Module', expected: true },
          { message: 'Loading Chunk Failed', expected: true },
          { message: 'Loading CSS Chunk Failed', expected: true },
          { message: 'NetworkError When Attempting To Fetch Resource', expected: true },

          // Partial matches with different casing
          { message: 'Something went wrong: FAILED TO FETCH', expected: true },
          { message: 'Error: Loading Chunk 123 Failed', expected: true },
          { message: 'TypeError: Failed To Fetch', expected: true },

          // Non-dynamic import errors (should not match)
          { message: 'UNEXPECTED TOKEN', expected: false },
          { message: 'Reference Error: Variable Not Defined', expected: false },
          { message: 'Custom Application Error', expected: false },
        ]

        testCases.forEach(({ message, expected }) => {
          const error = new Error(message)
          expect(isDynamicImportError(error)).toBe(expected)
        })
      })

      it('should detect dynamic import errors with various case combinations in error name', () => {
        const testCases = [
          // Lowercase in name
          { name: 'networkerror', message: 'Something went wrong', expected: true },
          { name: 'typeerror', message: 'failed to fetch', expected: true },

          // Uppercase in name
          { name: 'NETWORKERROR', message: 'Something went wrong', expected: true },
          { name: 'TYPEERROR', message: 'Failed to fetch', expected: true },

          // Mixed case in name
          { name: 'NetworkError', message: 'Something went wrong', expected: true },
          { name: 'TypeError', message: 'Failed to fetch', expected: true },

          // Non-matching names
          { name: 'ReferenceError', message: 'Variable not defined', expected: false },
          { name: 'SYNTAXERROR', message: 'Unexpected token', expected: false },
        ]

        testCases.forEach(({ name, message, expected }) => {
          const error = new Error(message)
          error.name = name
          expect(isDynamicImportError(error)).toBe(expected)
        })
      })

      it('should handle edge cases with special characters and unicode', () => {
        const testCases = [
          // Special characters
          { message: 'Failed to fetch: "dynamically imported module"', expected: true },
          { message: 'Loading chunk failed (chunk-123.js)', expected: true },

          // Unicode characters
          { message: 'Failed to fetch dynamically imported module 🚨', expected: true },
          { message: 'Loading chunk failed ⚠️', expected: true },

          // Empty/null cases
          { message: '', expected: false },
          { message: ' ', expected: false },
        ]

        testCases.forEach(({ message, expected }) => {
          const error = new Error(message)
          expect(isDynamicImportError(error)).toBe(expected)
        })
      })

      it('should handle errors with both name and message patterns', () => {
        // Error with matching pattern in both name and message
        const error1 = new Error('failed to fetch')
        error1.name = 'NetworkError'
        expect(isDynamicImportError(error1)).toBe(true)

        // Error with matching pattern in name only
        const error2 = new Error('Something went wrong')
        error2.name = 'NetworkError'
        expect(isDynamicImportError(error2)).toBe(true)

        // Error with matching pattern in message only
        const error3 = new Error('loading chunk failed')
        error3.name = 'CustomError'
        expect(isDynamicImportError(error3)).toBe(true)

        // Error with no matching patterns
        const error4 = new Error('Something went wrong')
        error4.name = 'CustomError'
        expect(isDynamicImportError(error4)).toBe(false)
      })
    })

    it('should detect all documented dynamic import error patterns', () => {
      const dynamicImportErrors = [
        'Failed to fetch dynamically imported module',
        'Loading chunk failed',
        'Loading CSS chunk failed',
        'Failed to fetch',
        'NetworkError when attempting to fetch resource',
        'Chunk load failed',
        'Loading chunk',
        'import() failed',
        'TypeError: Failed to fetch',
        'NetworkError',
      ]

      dynamicImportErrors.forEach((errorMessage) => {
        const error = new Error(errorMessage)
        expect(isDynamicImportError(error)).toBe(true)
      })
    })

    it('should not detect non-dynamic import errors', () => {
      const nonDynamicErrors = [
        'Unexpected token',
        'ReferenceError: variable is not defined',
        'TypeError: Cannot read property',
        'SyntaxError: Unexpected end of input',
        'Custom application error',
      ]

      nonDynamicErrors.forEach((errorMessage) => {
        const error = new Error(errorMessage)
        expect(isDynamicImportError(error)).toBe(false)
      })
    })
  })

  describe('configuration options', () => {
    it('should accept custom retry options', () => {
      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      // Test that it doesn't throw with custom options
      expect(() => {
        lazyWithRetry(mockImportFn, {
          maxRetries: 5,
          baseDelay: 2000,
          maxDelay: 10000,
          refreshOnFinalFailure: false,
        })
      }).not.toThrow()
    })

    it('should work with factory default merging', () => {
      const customFactory = createLazyFactory({
        maxRetries: 10,
        baseDelay: 500,
      })

      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      // Should work with additional options
      expect(() => {
        customFactory(mockImportFn, { refreshOnFinalFailure: false })
      }).not.toThrow()
    })
  })

  describe('localStorage integration', () => {
    it('should handle localStorage failures gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available')
      })

      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      // Should not throw even if localStorage fails
      expect(() => {
        lazyWithRetry(mockImportFn, { refreshOnFinalFailure: true })
      }).not.toThrow()
    })

    it('should work when localStorage returns null', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      expect(() => {
        lazyWithRetry(mockImportFn)
      }).not.toThrow()
    })

    it('should work when localStorage returns valid timestamp', () => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      mockLocalStorage.getItem.mockReturnValue(oneHourAgo.toString())

      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      expect(() => {
        lazyWithRetry(mockImportFn)
      }).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should handle zero maxRetries', () => {
      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      expect(() => {
        lazyWithRetry(mockImportFn, { maxRetries: 0 })
      }).not.toThrow()
    })

    it('should handle negative delays', () => {
      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      expect(() => {
        lazyWithRetry(mockImportFn, { baseDelay: -1000, maxDelay: -500 })
      }).not.toThrow()
    })

    it('should handle undefined options', () => {
      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      expect(() => {
        lazyWithRetry(mockImportFn, undefined as any)
      }).not.toThrow()
    })
  })

  describe('exports', () => {
    it('should export all expected functions', () => {
      expect(typeof lazyWithRetry).toBe('function')
      expect(typeof createLazy).toBe('function')
      expect(typeof createLazyFactory).toBe('function')
    })

    it('should have proper default options in createLazy', () => {
      // Test by creating a component and checking it works
      const mockImportFn = vi.fn().mockResolvedValue({ default: () => null })

      expect(() => {
        createLazy(mockImportFn)
      }).not.toThrow()
    })
  })
})
