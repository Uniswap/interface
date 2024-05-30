import { assert, errorToString, NotImplementedError } from 'utilities/src/errors'

describe('NotImplementedError', () => {
  it('throws an error with the correct message', () => {
    expect(() => {
      throw new NotImplementedError('functionName')
    }).toThrow('functionName() not implemented. Did you forget a platform override?')
  })
})

describe('assert', () => {
  it('throws an error if the predicate is false', () => {
    expect(() => {
      assert(false, 'error message')
    }).toThrow('error message')
  })

  it('does nothing if the predicate is true', () => {
    expect(() => {
      assert(true, 'error message')
    }).not.toThrow()
  })
})

describe('errorToString', () => {
  it('returns the error message if the error is an Error', () => {
    expect(errorToString(new Error('error message'))).toBe('error message')
  })

  it('returns the error message if the error is a string', () => {
    expect(errorToString('error message')).toBe('error message')
  })

  it('returns the error message if the error is a number', () => {
    expect(errorToString(123)).toBe('Error code: 123')
  })

  it('returns the error message if the error is an object', () => {
    expect(errorToString({ error: 'message' })).toBe('{"error":"message"}')
  })

  it('Trims error message if it is longer than maxLength', () => {
    expect(errorToString('error message', 5)).toBe('error...')
  })
})
