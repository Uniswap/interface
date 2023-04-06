/// <reference types="./setupJest" />

jest.asMock = function asMock<T extends (...args: any) => any>(fn: T) {
  if (!jest.isMockFunction(fn)) throw new Error('fn is not a mock')
  return fn as jest.MockedFunction<T>
}
