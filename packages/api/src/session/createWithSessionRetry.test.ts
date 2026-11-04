import { describe, expect, it, vi } from 'vitest'
import { FetchError } from '../clients/base/errors'
import { createWithSessionRetry } from './createWithSessionRetry'

// Built the way createFetchClient builds it: the status on the Response, the parsed JSON body on `data`.
function fetchError(status: number, data: object): FetchError {
  return new FetchError({ response: new Response(JSON.stringify(data), { status }), data })
}

describe('createWithSessionRetry', () => {
  it('reinitializes the session and retries once on a session 401', async () => {
    const reinitializeSession = vi.fn(async () => {})
    const withSessionRetry = createWithSessionRetry({ reinitializeSession })
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(fetchError(401, { errorCode: 'UnauthorizedError', detail: 'Unauthorized' }))
      .mockResolvedValueOnce('plan')

    await expect(withSessionRetry(fn)).resolves.toBe('plan')
    expect(reinitializeSession).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws a blocked-account 401 without reinitializing the session', async () => {
    const reinitializeSession = vi.fn(async () => {})
    const withSessionRetry = createWithSessionRetry({ reinitializeSession })
    const blocked = fetchError(401, { errorCode: 'UnauthorizedError', detail: 'Account is blocked' })
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(blocked)

    await expect(withSessionRetry(fn)).rejects.toBe(blocked)
    expect(reinitializeSession).not.toHaveBeenCalled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throws a 403 COMPLIANCE_BLOCKED without reinitializing the session', async () => {
    const reinitializeSession = vi.fn(async () => {})
    const withSessionRetry = createWithSessionRetry({ reinitializeSession })
    const blocked = fetchError(403, {
      errorCode: 'COMPLIANCE_BLOCKED',
      detail: 'Account is blocked',
      compliance: { walletBlocked: true },
    })
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(blocked)

    await expect(withSessionRetry(fn)).rejects.toBe(blocked)
    expect(reinitializeSession).not.toHaveBeenCalled()
  })

  it('calls onReinitializationFailed when the retry still 401s', async () => {
    const onReinitializationFailed = vi.fn()
    const withSessionRetry = createWithSessionRetry({ reinitializeSession: async () => {}, onReinitializationFailed })
    const expired = fetchError(401, { errorCode: 'UnauthorizedError', detail: 'Unauthorized' })
    const fn = vi.fn<() => Promise<string>>().mockRejectedValue(expired)

    await expect(withSessionRetry(fn)).rejects.toBe(expired)
    expect(onReinitializationFailed).toHaveBeenCalledTimes(1)
  })
})
