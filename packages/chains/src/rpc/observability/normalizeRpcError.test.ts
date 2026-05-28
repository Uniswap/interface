import { describe, expect, test } from 'vitest'
import { normalizeRpcError } from './normalizeRpcError'

describe('normalizeRpcError', () => {
  test('returns Error wrapping non-Error inputs', () => {
    const result = normalizeRpcError('boom')
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('boom')
  })

  test('extracts inner JSON-RPC error message from ethers wrapper', () => {
    // Real shape from ethers' StaticJsonRpcProvider.perform when the server
    // returns a JSON-RPC error body.
    const ethersErr = new Error('processing response error') as Error & {
      code: string
      error: { message: string; code: number; data: string }
    }
    ethersErr.code = 'SERVER_ERROR'
    ethersErr.error = { message: 'execution reverted', code: -32000, data: '0xabcd' }

    const result = normalizeRpcError(ethersErr)

    expect(result.message).toBe('execution reverted')
    expect(result.code).toBe(-32000)
    expect(result.data).toBe('0xabcd')
  })

  test('falls back to ethers `reason` for transport-level errors', () => {
    // Real shape from ethers when fetch fails (e.g. ECONNREFUSED). The
    // verbose `message` embeds requestBody (with per-request `id`) which
    // would defeat the rate limiter's bucket-by-message strategy.
    const ethersErr = new Error(
      'missing response (requestBody="{\\"id\\":42}", serverError={"code":"ECONNREFUSED"}, code=SERVER_ERROR)',
    ) as Error & { code: string; reason: string }
    ethersErr.code = 'SERVER_ERROR'
    ethersErr.reason = 'missing response'

    const result = normalizeRpcError(ethersErr)

    expect(result.message).toBe('missing response')
    expect(result.code).toBe('SERVER_ERROR')
    expect(result.message).not.toContain('id":42')
  })

  test('passes through clean errors unchanged', () => {
    const clean = new Error('execution reverted') as Error & { code: number }
    clean.code = -32000

    const result = normalizeRpcError(clean)

    // Same instance — no rewrap when no nested fields to extract
    expect(result).toBe(clean)
    expect(result.message).toBe('execution reverted')
    expect(result.code).toBe(-32000)
  })

  test('preserves stack trace when rewrapping', () => {
    const ethersErr = new Error('processing response error') as Error & {
      error: { message: string }
    }
    ethersErr.error = { message: 'execution reverted' }
    const originalStack = ethersErr.stack

    const result = normalizeRpcError(ethersErr)

    expect(result.stack).toBe(originalStack)
  })

  test('prefers inner.message over reason when both present', () => {
    const err = new Error('outer message') as Error & {
      reason: string
      error: { message: string; code: number }
    }
    err.reason = 'something happened'
    err.error = { message: 'execution reverted', code: -32000 }

    const result = normalizeRpcError(err)

    expect(result.message).toBe('execution reverted')
    expect(result.code).toBe(-32000)
  })
})
