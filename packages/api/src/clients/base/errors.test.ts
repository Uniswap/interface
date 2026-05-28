import { Code, ConnectError } from '@connectrpc/connect'
import { FetchError, is401Error } from '@universe/api/src/clients/base/errors'
import { describe, expect, it } from 'vitest'

describe('is401Error', () => {
  it('returns true for FetchError with 401 status', () => {
    const error = new FetchError({
      response: new Response(null, { status: 401 }),
    })
    expect(is401Error(error)).toBe(true)
  })

  it('returns false for FetchError with non-401 status', () => {
    const error = new FetchError({
      response: new Response(null, { status: 500 }),
    })
    expect(is401Error(error)).toBe(false)
  })

  it('returns true for ConnectError with Unauthenticated code', () => {
    const error = new ConnectError('unauthenticated', Code.Unauthenticated)
    expect(is401Error(error)).toBe(true)
  })

  it('returns false for ConnectError with other codes', () => {
    const error = new ConnectError('not found', Code.NotFound)
    expect(is401Error(error)).toBe(false)
  })

  it('returns false for generic Error', () => {
    expect(is401Error(new Error('random'))).toBe(false)
  })

  it('returns false for non-Error values', () => {
    expect(is401Error('string')).toBe(false)
    expect(is401Error(null)).toBe(false)
    expect(is401Error(undefined)).toBe(false)
  })
})
