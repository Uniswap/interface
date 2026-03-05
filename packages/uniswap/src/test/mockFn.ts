/**
 * Framework-agnostic mock function provider.
 * This module provides a mock function that works with both Jest and Vitest,
 * allowing test utilities to be shared across packages using different test frameworks.
 */

/**
 * Create a mock function that works with both Jest and Vitest.
 * This function lazily checks for the test framework at call time (not module load time)
 * to ensure the framework's globals are available.
 *
 * Returns `any` to allow flexible usage with different function signatures,
 * similar to how jest.fn() and vi.fn() work.
 */
export function createMockFn(): any {
  // Check for Vitest's vi global
  const vitestGlobal = (globalThis as any).vi
  if (vitestGlobal?.fn) {
    return vitestGlobal.fn()
  }

  // Check for Jest's jest global
  const jestGlobal = (globalThis as any).jest
  if (jestGlobal?.fn) {
    return jestGlobal.fn()
  }

  // Fallback: return a simple no-op mock function
  // This allows the code to be imported even outside test contexts
  const mockFn: any = (..._args: unknown[]) => undefined
  mockFn.mockImplementation = (impl: any): any => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const newMock: any = (...args: unknown[]) => impl(...args)
    newMock.mockImplementation = mockFn.mockImplementation
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return newMock
  }
  return mockFn
}
