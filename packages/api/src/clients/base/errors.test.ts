import { Code, ConnectError } from '@connectrpc/connect'
import type { SessionService } from '@universe/sessions'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFetchClient } from './createFetchClient'
import { FetchError, is401Error, is403Error, isBlockedAccountFetchError } from './errors'

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

describe('is403Error', () => {
  it('returns true for FetchError with 403 status', () => {
    expect(is403Error(new FetchError({ response: new Response(null, { status: 403 }) }))).toBe(true)
  })

  it('returns false for FetchError with non-403 status', () => {
    expect(is403Error(new FetchError({ response: new Response(null, { status: 401 }) }))).toBe(false)
  })

  it('returns false for non-FetchError values', () => {
    expect(is403Error(new Error('Response status: 403'))).toBe(false)
    expect(is403Error(null)).toBe(false)
  })
})

describe('isBlockedAccountFetchError', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // Goes through the real client so `data` is whatever it parses off the wire, not a hand-built FetchError.
  async function fetchErrorFor(status: number, body: unknown): Promise<unknown> {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
      ),
    )
    const client = createFetchClient({
      baseUrl: 'https://trading-api.example.com',
      getSessionService: () => ({ getSessionState: async () => null }) as unknown as SessionService,
    })
    try {
      await client.post('/swap', { body: '{}' })
    } catch (error) {
      return error
    }
    throw new Error('expected the request to fail')
  }

  it('matches trading 401 UnauthorizedError "Account is blocked"', async () => {
    const error = await fetchErrorFor(401, { errorCode: 'UnauthorizedError', detail: 'Account is blocked' })
    expect(error).toBeInstanceOf(FetchError)
    expect(isBlockedAccountFetchError(error)).toBe(true)
  })

  it('matches the entry-gateway 403 COMPLIANCE_BLOCKED wallet block', async () => {
    const error = await fetchErrorFor(403, {
      errorCode: 'COMPLIANCE_BLOCKED',
      detail: 'Account is blocked',
      compliance: { walletBlocked: true },
    })
    expect(isBlockedAccountFetchError(error)).toBe(true)
  })

  it('matches a 403 COMPLIANCE_BLOCKED whose compliance block marks the wallet even if detail changes', async () => {
    const error = await fetchErrorFor(403, {
      errorCode: 'COMPLIANCE_BLOCKED',
      detail: 'Blocked',
      compliance: { walletBlocked: true, blockedTokens: [] },
    })
    expect(isBlockedAccountFetchError(error)).toBe(true)
  })

  it('matches trading 403 ForbiddenError and /quote 403 Forbidden "Account is blocked"', async () => {
    expect(
      isBlockedAccountFetchError(
        await fetchErrorFor(403, { errorCode: 'ForbiddenError', detail: 'Account is blocked' }),
      ),
    ).toBe(true)
    expect(
      isBlockedAccountFetchError(await fetchErrorFor(403, { errorCode: 'Forbidden', detail: 'Account is blocked' })),
    ).toBe(true)
  })

  it('does not match a token-only 403 COMPLIANCE_BLOCKED', async () => {
    const error = await fetchErrorFor(403, {
      errorCode: 'COMPLIANCE_BLOCKED',
      detail: 'Token is blocked',
      compliance: {
        blockedTokens: [
          {
            chainId: 1,
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            reasons: ['RESTRICTION_REASON_REQUIRES_ACKNOWLEDGEMENT'],
          },
        ],
      },
    })
    expect(isBlockedAccountFetchError(error)).toBe(false)
  })

  it('does not match a plain 401 session expiry', async () => {
    const error = await fetchErrorFor(401, { errorCode: 'UnauthorizedError', detail: 'Unauthorized' })
    expect(is401Error(error)).toBe(true)
    expect(isBlockedAccountFetchError(error)).toBe(false)
  })

  it('does not match a 403 without a blocked-account body', async () => {
    const error = await fetchErrorFor(403, { errorCode: 'Forbidden', detail: 'Forbidden' })
    expect(is403Error(error)).toBe(true)
    expect(isBlockedAccountFetchError(error)).toBe(false)
  })

  it('does not match a blocked-account detail on any other status', async () => {
    expect(
      isBlockedAccountFetchError(
        await fetchErrorFor(500, { errorCode: 'InternalServerError', detail: 'Account is blocked' }),
      ),
    ).toBe(false)
  })

  it('does not match a FetchError whose body was not JSON, or non-FetchErrors', () => {
    expect(isBlockedAccountFetchError(new FetchError({ response: new Response('<html/>', { status: 403 }) }))).toBe(
      false,
    )
    expect(isBlockedAccountFetchError(new Error('Account is blocked'))).toBe(false)
    expect(isBlockedAccountFetchError(undefined)).toBe(false)
  })
})
