import { Code, ConnectError } from '@connectrpc/connect'
import {
  isConnectUnauthorized,
  isFetchUnauthorized,
  isSessionAuthFailureStatus,
} from '@universe/sessions/src/session-gate/classifyError'
import { describe, expect, it } from 'vitest'

describe('isSessionAuthFailureStatus', () => {
  it('matches 401 (low score) and 403 (no session yet)', () => {
    expect(isSessionAuthFailureStatus(401)).toBe(true)
    expect(isSessionAuthFailureStatus(403)).toBe(true)
  })

  it('rejects other statuses', () => {
    expect(isSessionAuthFailureStatus(200)).toBe(false)
    expect(isSessionAuthFailureStatus(400)).toBe(false)
    expect(isSessionAuthFailureStatus(404)).toBe(false)
    expect(isSessionAuthFailureStatus(500)).toBe(false)
  })
})

describe('isConnectUnauthorized', () => {
  it('matches ConnectError with Unauthenticated (401) or PermissionDenied (403)', () => {
    expect(isConnectUnauthorized(new ConnectError('nope', Code.Unauthenticated))).toBe(true)
    expect(isConnectUnauthorized(new ConnectError('forbidden', Code.PermissionDenied))).toBe(true)
  })

  it('rejects other Connect codes and non-Connect values', () => {
    expect(isConnectUnauthorized(new ConnectError('nope', Code.Internal))).toBe(false)
    expect(isConnectUnauthorized(new Error('401'))).toBe(false)
    expect(isConnectUnauthorized(null)).toBe(false)
  })
})

describe('isFetchUnauthorized', () => {
  it('matches Error messages containing the 401/403 status as a word', () => {
    expect(isFetchUnauthorized(new Error('RPC request failed: 401 Unauthorized'))).toBe(true)
    expect(isFetchUnauthorized(new Error('Status: 401'))).toBe(true)
    expect(isFetchUnauthorized(new Error('403 Forbidden'))).toBe(true)
  })

  it('rejects other statuses, substring matches, and non-Errors', () => {
    expect(isFetchUnauthorized(new Error('500 Internal Server Error'))).toBe(false)
    expect(isFetchUnauthorized(new Error('error 4010'))).toBe(false)
    expect(isFetchUnauthorized(new Error('error 1401'))).toBe(false)
    expect(isFetchUnauthorized(new Error('error 4030'))).toBe(false)
    expect(isFetchUnauthorized(new Error('error 1403'))).toBe(false)
    expect(isFetchUnauthorized('401')).toBe(false)
    expect(isFetchUnauthorized(null)).toBe(false)
  })

  it('prefers typed status over the message regex', () => {
    expect(isFetchUnauthorized(Object.assign(new Error('Network error'), { status: 401 }))).toBe(true)
    expect(isFetchUnauthorized(Object.assign(new Error('Network error'), { status: 403 }))).toBe(true)

    // Typed non-auth status wins over an incidental "401" in the message.
    const errWith500Status = Object.assign(new Error('upstream returned 401-ish from cache'), { status: 500 })
    expect(isFetchUnauthorized(errWith500Status)).toBe(false)
  })
})
