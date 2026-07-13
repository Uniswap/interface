import { describe, expect, test } from 'vitest'
import { extractRpcErrorMeta } from './extractRpcErrorMeta'

describe('extractRpcErrorMeta', () => {
  describe('HTTP status from structured fields', () => {
    test('ethers "bad response" — status + SERVER_ERROR category', () => {
      // Shape from @ethersproject/web logger.throwError('bad response', SERVER_ERROR, { status })
      const err = new Error('bad response (status=401, headers={...}, body="...")') as Error & {
        status: number
        code: string
        reason: string
      }
      err.status = 401
      err.code = 'SERVER_ERROR'
      err.reason = 'bad response'

      expect(extractRpcErrorMeta(err)).toEqual({ httpStatus: 401, errorCategory: 'SERVER_ERROR' })
    })

    test('viem HttpRequestError — status, no string category', () => {
      const err = new Error('HTTP request failed.\n\nStatus: 403\nURL: https://gw/rpc/1') as Error & {
        status: number
        name: string
      }
      err.name = 'HttpRequestError'
      err.status = 403

      expect(extractRpcErrorMeta(err)).toEqual({ httpStatus: 403 })
    })

    test('Web3Provider fetch-func — status attached at throw site', () => {
      const err = new Error('RPC request failed: 403') as Error & { status: number }
      err.status = 403

      expect(extractRpcErrorMeta(err)).toEqual({ httpStatus: 403 })
    })

    test('rejects out-of-range status values', () => {
      const low = new Error('x') as Error & { status: number }
      low.status = 99
      const high = new Error('y') as Error & { status: number }
      high.status = 700

      expect(extractRpcErrorMeta(low)).toEqual({})
      expect(extractRpcErrorMeta(high)).toEqual({})
    })
  })

  describe('JSON-RPC error code', () => {
    test('ethers JSON-RPC envelope — numeric code from nested `error`, string code as category', () => {
      // Shape from ethers StaticJsonRpcProvider when the server returns { error }.
      const err = new Error('processing response error') as Error & {
        code: string
        error: { code: number; message: string; data: string }
      }
      err.code = 'SERVER_ERROR'
      err.error = { code: -32000, message: 'execution reverted', data: '0xabcd' }

      expect(extractRpcErrorMeta(err)).toEqual({ rpcErrorCode: -32000, errorCategory: 'SERVER_ERROR' })
    })

    test('Web3Provider fetch-func — numeric code attached directly', () => {
      const err = new Error('execution reverted') as Error & { code: number }
      err.code = -32000

      expect(extractRpcErrorMeta(err)).toEqual({ rpcErrorCode: -32000 })
    })

    test('viem RpcError nested under `cause`', () => {
      const inner = new Error('rpc') as Error & { code: number }
      inner.code = -32603
      const err = new Error('wrapper') as Error & { cause: Error }
      err.cause = inner

      expect(extractRpcErrorMeta(err)).toEqual({ rpcErrorCode: -32603 })
    })

    test('takes the first numeric code in BFS order (root before nested)', () => {
      const err = new Error('outer') as Error & { code: number; error: { code: number } }
      err.code = -32000
      err.error = { code: -32603 }

      expect(extractRpcErrorMeta(err).rpcErrorCode).toBe(-32000)
    })
  })

  describe('network / transport failures (no HTTP status — the signal)', () => {
    test('ethers "missing response" — category only, no status', () => {
      const err = new Error('missing response (requestBody="...", serverError={...})') as Error & {
        code: string
        reason: string
        serverError: Error
      }
      err.code = 'SERVER_ERROR'
      err.reason = 'missing response'
      err.serverError = new Error('Failed to fetch')

      expect(extractRpcErrorMeta(err)).toEqual({ errorCategory: 'SERVER_ERROR' })
    })

    test('ethers timeout — TIMEOUT category', () => {
      const err = new Error('timeout (...)') as Error & { code: string }
      err.code = 'TIMEOUT'

      expect(extractRpcErrorMeta(err)).toEqual({ errorCategory: 'TIMEOUT' })
    })

    test('plain error with no usable fields → empty', () => {
      expect(extractRpcErrorMeta(new Error('execution reverted'))).toEqual({})
    })
  })

  describe('status recovery from message (fallback when no structured field)', () => {
    test('ethers verbose "status=NNN" form', () => {
      // Older app versions emit the verbose ethers message un-normalized.
      const err = new Error('bad response (status=502, headers={...}, code=SERVER_ERROR)') as Error & { code: string }
      err.code = 'SERVER_ERROR'

      expect(extractRpcErrorMeta(err)).toEqual({ httpStatus: 502, errorCategory: 'SERVER_ERROR' })
    })

    test('viem "Status: NNN" form', () => {
      expect(extractRpcErrorMeta(new Error('HTTP request failed.\n\nStatus: 429\nURL: x'))).toEqual({ httpStatus: 429 })
    })

    test('Web3Provider "RPC request failed: NNN" form (trailing space, empty statusText)', () => {
      expect(extractRpcErrorMeta(new Error('RPC request failed: 401 '))).toEqual({ httpStatus: 401 })
    })

    test('structured field wins over message when both present', () => {
      const err = new Error('bad response (status=502)') as Error & { status: number }
      err.status = 503
      expect(extractRpcErrorMeta(err).httpStatus).toBe(503)
    })
  })

  describe('robustness', () => {
    test('non-Error inputs → empty', () => {
      expect(extractRpcErrorMeta('boom')).toEqual({})
      expect(extractRpcErrorMeta(null)).toEqual({})
      expect(extractRpcErrorMeta(undefined)).toEqual({})
      expect(extractRpcErrorMeta(42)).toEqual({})
    })

    test('cyclic cause chain does not hang', () => {
      const a = new Error('a') as Error & { cause?: unknown; status: number }
      const b = new Error('b') as Error & { cause?: unknown }
      a.cause = b
      b.cause = a
      a.status = 500

      expect(extractRpcErrorMeta(a)).toEqual({ httpStatus: 500 })
    })
  })
})
