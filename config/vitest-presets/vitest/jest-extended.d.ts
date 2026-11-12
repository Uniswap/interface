/// <reference types="jest-extended" />
import 'vitest'

// Vitest 5 stopped reading `jest.Matchers`, the only place jest-extended declares its matchers.
// `CustomMatchers` extends `Record<string, any>`; drop that index signature so typos still fail.
type JestExtendedMatchers<R> = {
  [K in keyof CustomMatchers<R> as string extends K ? never : number extends K ? never : K]: CustomMatchers<R>[K]
}

declare module 'vitest' {
  interface Matchers<R, T> extends JestExtendedMatchers<R> {}
}
