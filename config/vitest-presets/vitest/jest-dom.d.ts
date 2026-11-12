import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import 'vitest'

// Vitest 5 stopped reading `jest.Matchers`, and jest-dom's own `vitest` entry still augments the
// pre-5 single-parameter `Assertion<T>`.
declare module 'vitest' {
  interface Matchers<R, T> extends TestingLibraryMatchers<unknown, R> {}
}
