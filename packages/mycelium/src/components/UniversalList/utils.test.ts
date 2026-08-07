import { beforeEach, describe, expect, it, vi } from 'vitest'
import { warnOnDuplicateKeys } from './utils'

const { mockError } = vi.hoisted(() => ({ mockError: vi.fn() }))

vi.mock('@universe/logger', () => ({
  createConsoleLogger: () => ({ error: mockError }),
}))

describe('warnOnDuplicateKeys', () => {
  beforeEach(() => {
    mockError.mockClear()
  })

  it('logs an error listing the duplicate keys', () => {
    warnOnDuplicateKeys(['a', 'b', 'a', 'c', 'b'])

    expect(mockError).toHaveBeenCalledTimes(1)
    const message = String(mockError.mock.calls[0]?.[0])
    expect(message).toContain('a')
    expect(message).toContain('b')
  })

  it('does not log when all keys are unique', () => {
    warnOnDuplicateKeys(['a', 'b', 'c'])

    expect(mockError).not.toHaveBeenCalled()
  })

  it('does not log for an empty list', () => {
    warnOnDuplicateKeys([])

    expect(mockError).not.toHaveBeenCalled()
  })
})
