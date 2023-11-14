/**
 * Casts the passed function as a jest.Mock.
 * Use this in combination with jest.mock() to safely access functions from mocked modules.
 *
 * @example
 *
 *  import { useExample } from 'example'
 *  jest.mock('example', () => ({ useExample: jest.fn() }))
 *  beforeEach(() => {
 *    asMock(useExample).mockImplementation(() => ...)
 *  })
 */
// jest expects mocks to be coerced (eg fn as jest.MockedFunction<T>), but this is not ergonomic when using ASI.
// Instead, we use this utility function to improve readability and add a check to ensure the function is a mock.
export function mocked<T extends (...args: any) => any>(fn: T) {
  if (!jest.isMockFunction(fn)) throw new Error('fn is not a mock')
  return fn as jest.MockedFunction<T>
}
