import { render, screen, waitFor } from '@testing-library/react'
import { Component, ComponentType, ReactElement, ReactNode, Suspense, createElement } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createLazy,
  createLazyFactory,
  createLazyNoReload,
  isDynamicImportError,
  lazyWithRetry,
} from '~/utils/lazyWithRetry'

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

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
          { message: 'Importing a module script failed.', expected: true },
          {
            message: 'error loading dynamically imported module: https://cdn.app.uniswap.org/assets/a.js',
            expected: true,
          },
          { message: 'Unable to preload CSS for https://cdn.app.uniswap.org/assets/a.css', expected: true },

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

  describe('final failure behavior', () => {
    const FAST_RETRY_OPTIONS = { maxRetries: 1, baseDelay: 0, maxDelay: 0 }

    function chunkLoadError(): Error {
      return new Error('Failed to fetch dynamically imported module')
    }

    function LoadedComponent(): ReactElement {
      return createElement('div', { 'data-testid': 'loaded-component' })
    }

    function renderInSuspense(LazyComponent: ComponentType, fallback: ReactNode = null): ReturnType<typeof render> {
      return render(createElement(Suspense, { fallback }, createElement(LazyComponent)))
    }

    class TestErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
      state = { hasError: false }

      static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true }
      }

      override render(): ReactNode {
        return this.state.hasError ? createElement('div', { 'data-testid': 'error-fallback' }) : this.props.children
      }
    }

    it('reloads the page when a user-initiated lazy load fails after all retries', async () => {
      const importFn = vi.fn().mockRejectedValue(chunkLoadError())
      const LazyComponent = lazyWithRetry(importFn, FAST_RETRY_OPTIONS)

      render(
        createElement(
          TestErrorBoundary,
          null,
          createElement(Suspense, { fallback: null }, createElement(LazyComponent)),
        ),
      )

      await waitFor(() => expect(mockReload).toHaveBeenCalledTimes(1))
      expect(importFn).toHaveBeenCalledTimes(2)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lazy-retry-refresh', expect.any(String))
    })

    describe('createLazyNoReload', () => {
      it('renders the component when the import succeeds', async () => {
        const importFn = vi.fn().mockResolvedValue({ default: LoadedComponent })
        const NoReloadComponent = createLazyNoReload(importFn, FAST_RETRY_OPTIONS)

        renderInSuspense(NoReloadComponent)

        expect(await screen.findByTestId('loaded-component')).toBeInTheDocument()
      })

      it('logs and renders nothing instead of reloading when the import fails after all retries', async () => {
        const importFn = vi.fn().mockRejectedValue(chunkLoadError())
        const NoReloadComponent = createLazyNoReload(importFn, FAST_RETRY_OPTIONS)

        const { container } = renderInSuspense(NoReloadComponent)

        await waitFor(() => expect(importFn).toHaveBeenCalledTimes(2))
        await waitFor(() => expect(container).toBeEmptyDOMElement())
        expect(mockReload).not.toHaveBeenCalled()
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
        expect(logger.error).toHaveBeenCalledWith(
          expect.objectContaining({ message: expect.stringContaining('Failed to fetch') }),
          expect.anything(),
        )
      })

      it('re-attempts the import on the next mount after a final failure', async () => {
        const importFn = vi
          .fn()
          .mockRejectedValueOnce(chunkLoadError())
          .mockRejectedValueOnce(chunkLoadError())
          .mockResolvedValueOnce({ default: LoadedComponent })
        const NoReloadComponent = createLazyNoReload(importFn, FAST_RETRY_OPTIONS)

        const firstMount = renderInSuspense(
          NoReloadComponent,
          createElement('div', { 'data-testid': 'loading-fallback' }),
        )
        await waitFor(() => expect(importFn).toHaveBeenCalledTimes(2))
        // The failed load must commit (fallback gone) before the next mount can re-attempt
        await waitFor(() => expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument())
        firstMount.unmount()

        renderInSuspense(NoReloadComponent)

        expect(await screen.findByTestId('loaded-component')).toBeInTheDocument()
        expect(importFn).toHaveBeenCalledTimes(3)
        expect(mockReload).not.toHaveBeenCalled()
      })

      it('treats an import that resolves undefined as a retryable failure', async () => {
        const importFn = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce({ default: LoadedComponent })
        const NoReloadComponent = createLazyNoReload(importFn, FAST_RETRY_OPTIONS)

        renderInSuspense(NoReloadComponent)

        expect(await screen.findByTestId('loaded-component')).toBeInTheDocument()
        expect(importFn).toHaveBeenCalledTimes(2)
        expect(mockReload).not.toHaveBeenCalled()
      })

      it('rethrows non-import errors to the nearest error boundary', async () => {
        const importFn = vi.fn().mockRejectedValue(new Error('Unexpected token'))
        const NoReloadComponent = createLazyNoReload(importFn, FAST_RETRY_OPTIONS)

        render(
          createElement(
            TestErrorBoundary,
            null,
            createElement(Suspense, { fallback: null }, createElement(NoReloadComponent)),
          ),
        )

        expect(await screen.findByTestId('error-fallback')).toBeInTheDocument()
        expect(importFn).toHaveBeenCalledTimes(1)
        expect(mockReload).not.toHaveBeenCalled()
      })
    })
  })

  describe('exports', () => {
    it('should export all expected functions', () => {
      expect(typeof lazyWithRetry).toBe('function')
      expect(typeof createLazy).toBe('function')
      expect(typeof createLazyFactory).toBe('function')
      expect(typeof createLazyNoReload).toBe('function')
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
