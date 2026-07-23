import { describe, expect, it } from 'vitest'
import { coerceUnknownToError } from '~/utils/coerceUnknownToError'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

describe('coerceUnknownToError', () => {
  it('returns Errors unchanged', () => {
    const e = new Error('x')
    expect(coerceUnknownToError(e, 'fallback')).toBe(e)
  })

  it('copies EIP-1193 fields from a plain rejection object onto an Error', () => {
    const err = coerceUnknownToError({ code: 4001, message: 'User rejected the request.' }, 'fallback')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('User rejected the request.')
    expect((err as Error & { code: number }).code).toBe(4001)
    expect(didUserReject(err)).toBe(true)
  })
})
