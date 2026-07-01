import { describe, expect, it } from 'vitest'
import { getWriteParameters } from './shared'

describe('getWriteParameters', () => {
  it('treats a leading array as args with options second', () => {
    expect(getWriteParameters([[1n, 'a'], { value: 2n }])).toEqual({
      args: [1n, 'a'],
      options: { value: 2n },
    })
  })

  it('treats a leading array without options as args only', () => {
    expect(getWriteParameters([[1n]])).toEqual({ args: [1n], options: {} })
  })

  it('treats a leading object as options with no args', () => {
    expect(getWriteParameters([{ value: 2n }])).toEqual({ args: [], options: { value: 2n } })
  })

  it('handles no parameters', () => {
    expect(getWriteParameters([])).toEqual({ args: [], options: {} })
  })
})
