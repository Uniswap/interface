import { logger } from 'utilities/src/logger/logger'
import { afterEach, beforeEach, describe, expect, type Mock, test, vi } from 'vitest'
import { getRpcObserver, resetErrorBuckets, type RpcErrorContext } from './rpcObserver'

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

let mockNow = 0

function advanceTime(ms: number): void {
  mockNow += ms
}

function makeError(opts: Partial<RpcErrorContext> = {}): RpcErrorContext {
  return {
    requestId: opts.requestId ?? 'rpc-1',
    method: opts.method ?? 'eth_call',
    params: opts.params,
    chainId: opts.chainId ?? 1,
    url: opts.url ?? 'https://mainnet.example.com',
    transport: opts.transport ?? 'viem',
    durationMs: opts.durationMs ?? 100,
    error: opts.error ?? new Error('boom'),
  }
}

function getSummaryCall(): unknown[] | undefined {
  return (logger.warn as Mock).mock.calls.find((args: unknown[]) => String(args[2]).includes('Suppressed'))
}

describe('rpcObserver rate limiting', () => {
  beforeEach(() => {
    mockNow = 0
    vi.spyOn(performance, 'now').mockImplementation(() => mockNow)
    resetErrorBuckets()
    vi.mocked(logger.warn).mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('logs every error up to the per-window cap', () => {
    const observer = getRpcObserver()
    for (let i = 0; i < 5; i++) {
      observer.onError(makeError({ requestId: `rpc-${i}` }))
    }
    expect(logger.warn).toHaveBeenCalledTimes(5)
  })

  test('suppresses errors past the cap silently within a window', () => {
    const observer = getRpcObserver()
    for (let i = 0; i < 30; i++) {
      observer.onError(makeError({ requestId: `rpc-${i}` }))
    }
    expect(logger.warn).toHaveBeenCalledTimes(5)
  })

  test('emits a summary on the first error of the next window', () => {
    const observer = getRpcObserver()
    for (let i = 0; i < 25; i++) {
      observer.onError(makeError({ method: 'eth_call', error: new Error('timeout') }))
    }
    advanceTime(60_000)
    observer.onError(makeError({ method: 'eth_blockNumber', error: new Error('502') }))

    // 5 logged in window 1 + 1 summary + 1 new error = 7
    expect(logger.warn).toHaveBeenCalledTimes(7)

    const summaryCall = getSummaryCall()
    expect(summaryCall).toBeDefined()
    expect(summaryCall?.[2]).toBe('Suppressed 20 RPC errors in previous 60s window')
    const summaryPayload = summaryCall?.[3] as {
      methods: Record<string, number>
      errors: Record<string, number>
    }
    expect(summaryPayload.methods).toEqual({ eth_call: 20 })
    expect(summaryPayload.errors).toEqual({ timeout: 20 })
  })

  test('does not emit a summary if the previous window had no suppressed errors', () => {
    const observer = getRpcObserver()
    for (let i = 0; i < 5; i++) {
      observer.onError(makeError())
    }
    advanceTime(60_000)
    observer.onError(makeError())

    expect(logger.warn).toHaveBeenCalledTimes(6)
    expect(getSummaryCall()).toBeUndefined()
  })

  test('isolates buckets per (provider, chainId)', () => {
    const observer = getRpcObserver()
    for (let i = 0; i < 10; i++) {
      observer.onError(makeError({ chainId: 1, url: 'https://mainnet.a.com' }))
    }
    for (let i = 0; i < 10; i++) {
      observer.onError(makeError({ chainId: 137, url: 'https://polygon.b.com' }))
    }
    // 5 logged for each bucket = 10 total
    expect(logger.warn).toHaveBeenCalledTimes(10)
  })

  test('caps the suppressed-keys map at MAX_KEYS_PER_BUCKET to bound payload size', () => {
    const observer = getRpcObserver()
    // Fill the under-cap quota first so subsequent errors are suppressed.
    for (let i = 0; i < 5; i++) {
      observer.onError(makeError({ error: new Error('first batch') }))
    }
    // 30 unique error messages in the suppressed range.
    for (let i = 0; i < 30; i++) {
      observer.onError(makeError({ error: new Error(`unique-${i}`) }))
    }

    advanceTime(60_000)
    observer.onError(makeError())

    const summaryCall = getSummaryCall()
    const errors = (summaryCall?.[3] as { errors: Record<string, number> }).errors
    // Up to 20 unique keys + at most 1 "<other>" rollup.
    expect(Object.keys(errors).length).toBeLessThanOrEqual(21)
    expect(errors['<other>']).toBeGreaterThan(0)
  })

  test('coerces non-Error values via String() so payload always contains a message', () => {
    const observer = getRpcObserver()
    observer.onError(makeError({ error: 'plain string' }))
    observer.onError(makeError({ error: { code: 42 } }))

    const calls = vi.mocked(logger.warn).mock.calls
    expect(calls[0]?.[3]).toMatchObject({ error: 'plain string' })
    expect(calls[1]?.[3]).toMatchObject({ error: '[object Object]' })
  })

  test('window math is immune to wall-clock (Date) jumps', () => {
    const observer = getRpcObserver()
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)

    // Burst that fills + suppresses inside window 1.
    for (let i = 0; i < 10; i++) {
      observer.onError(makeError())
    }
    expect(logger.warn).toHaveBeenCalledTimes(5)

    // Simulate an NTP correction jumping Date forward by an hour. If the
    // limiter were keyed on Date.now() it would consider the window expired
    // and flush a summary on the next error.
    dateSpy.mockReturnValue(1_700_000_000_000 + 3_600_000)
    observer.onError(makeError())
    expect(getSummaryCall()).toBeUndefined()

    // ...and a backward jump. Same expectation: no flush.
    dateSpy.mockReturnValue(1_699_999_000_000)
    observer.onError(makeError())
    expect(getSummaryCall()).toBeUndefined()

    // Only advancing the monotonic clock past the window flushes the summary.
    advanceTime(60_000)
    observer.onError(makeError())
    expect(getSummaryCall()).toBeDefined()
  })

  test('resetErrorBuckets clears state between test cases', () => {
    const observer = getRpcObserver()
    for (let i = 0; i < 25; i++) {
      observer.onError(makeError())
    }
    expect(logger.warn).toHaveBeenCalledTimes(5)

    resetErrorBuckets()
    vi.mocked(logger.warn).mockClear()

    for (let i = 0; i < 5; i++) {
      observer.onError(makeError())
    }
    // After reset, the cap resets — all 5 should log without a summary.
    expect(logger.warn).toHaveBeenCalledTimes(5)
    expect(getSummaryCall()).toBeUndefined()
  })
})
