import type { MockedFunction } from 'vitest'
import { vi } from 'vitest'

/**
 * Casts the passed function as a vitest Mock.
 * Use this in combination with vi.mock() to safely access functions from mocked modules.
 *
 * @example
 *
 *  import { useExample } from 'example'
 *  vi.mock('example', () => ({ useExample: vi.fn() }))
 *  beforeEach(() => {
 *    asMock(useExample).mockImplementation(() => ...)
 *  })
 */
// vitest expects mocks to be coerced (eg fn as a Vitest MockedFunction<T>), but this is not ergonomic when using ASI.
// Instead, we use this utility function to improve readability and add a check to ensure the function is a mock.
export function mocked<T extends (...args: any) => any>(fn: T) {
  const isMock = typeof vi !== 'undefined' && vi.isMockFunction(fn)

  if (!isMock) {
    throw new Error('fn is not a mock')
  }

  return fn as MockedFunction<T>
}
