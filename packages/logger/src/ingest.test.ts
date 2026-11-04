import { describe, expect, it, vi } from 'vitest'
import { ingestClientLogs, logIngestSchema, requestBytes, sanitizeContext } from './ingest'
import { createSlidingWindowLimiter } from './rateLimit/createSlidingWindowLimiter'
import type { Logger } from './types'

function fakeLogger(): Logger {
  const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  }
  logger.child.mockReturnValue(logger as unknown as Logger)
  return logger as unknown as Logger
}

function entry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    timestamp: '2026-08-02T00:00:00.000Z',
    level: 'error',
    service: 'rh-cca',
    message: 'client.uncaught_error',
    ...overrides,
  }
}

describe('logIngestSchema', () => {
  it('accepts a well-formed batch', () => {
    expect(logIngestSchema.safeParse({ entries: [entry()] }).success).toBe(true)
  })

  it('rejects a batch larger than 50 entries', () => {
    const entries = Array.from({ length: 51 }, () => entry())
    expect(logIngestSchema.safeParse({ entries }).success).toBe(false)
  })

  it('rejects an unknown level', () => {
    expect(logIngestSchema.safeParse({ entries: [entry({ level: 'catastrophe' })] }).success).toBe(false)
  })

  it('caps message length so a client cannot write an unbounded record', () => {
    expect(logIngestSchema.safeParse({ entries: [entry({ message: 'x'.repeat(2_001) })] }).success).toBe(false)
  })

  it('caps stack length', () => {
    const oversized = entry({ error: { message: 'm', stack: 'x'.repeat(10_001) } })
    expect(logIngestSchema.safeParse({ entries: [oversized] }).success).toBe(false)
  })
})

describe('sanitizeContext — bounded, because this endpoint is unauthenticated', () => {
  it('keeps the flat primitive shapes our own call sites send', () => {
    expect(sanitizeContext({ surface: 'client', script_url: 'app.js', line: 1, column: 2 })).toEqual({
      surface: 'client',
      script_url: 'app.js',
      line: 1,
      column: 2,
    })
    expect(sanitizeContext({ method: 'GET' })).toEqual({ method: 'GET' })
  })

  it('drops a nested object — no unbounded depth reaches the log', () => {
    expect(sanitizeContext({ keep: 'a', nested: { deep: { deeper: 'x' } } })).toEqual({ keep: 'a' })
  })

  it('drops an array value', () => {
    expect(sanitizeContext({ keep: 'a', items: [1, 2, 3] })).toEqual({ keep: 'a' })
  })

  it('drops an oversized value but keeps its siblings', () => {
    expect(sanitizeContext({ keep: 'a', blob: 'x'.repeat(1_025) })).toEqual({ keep: 'a' })
  })

  it('keeps a value exactly at the size limit', () => {
    const atLimit = 'x'.repeat(1_024)
    expect(sanitizeContext({ blob: atLimit })).toEqual({ blob: atLimit })
  })

  it('drops an oversized key', () => {
    expect(sanitizeContext({ ['k'.repeat(65)]: 'v', keep: 'a' })).toEqual({ keep: 'a' })
  })

  it('caps the number of keys', () => {
    const many = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`k${i}`, 'v']))
    expect(Object.keys(sanitizeContext(many))).toHaveLength(32)
  })

  it('keeps null, zero and false rather than treating them as absent', () => {
    expect(sanitizeContext({ a: null, b: 0, c: false })).toEqual({ a: null, b: 0, c: false })
  })

  it.each([
    ['timestamp'],
    ['level'],
    ['message'],
    ['service'],
    ['error'],
    ['source'],
    ['dd.trace_id'],
    ['status'],
    ['host'],
    ['env'],
    ['ddsource'],
    ['ddtags'],
    ['trace_id'],
    ['span_id'],
    ['date'],
  ])('drops the reserved key %s so a client cannot forge a record', (key) => {
    expect(sanitizeContext({ [key]: 'forged' })).toEqual({})
  })

  // Datadog's default remap aliases for status, message, host, date and service.
  it.each([
    ['severity'],
    ['syslog.severity'],
    ['msg'],
    ['log'],
    ['hostname'],
    ['syslog.hostname'],
    ['_timestamp'],
    ['Timestamp'],
    ['eventTime'],
    ['published_date'],
    ['syslog.appname'],
    ['Status'],
  ])('drops the Datadog alias %s, which would remap onto a reserved attribute', (key) => {
    expect(sanitizeContext({ [key]: 'forged', surface: 'client' })).toEqual({ surface: 'client' })
  })

  it('handles undefined', () => {
    expect(sanitizeContext(undefined)).toEqual({})
  })

  // Datadog remaps the reserved attribute `status`, and a NUMERIC one silently
  // downgrades the record's severity — an error would vanish from error-level
  // views. The logger emits `level`, so a caller is the only way one arrives.
  it('drops a numeric status, which would otherwise downgrade severity in Datadog', () => {
    expect(sanitizeContext({ status: 200, surface: 'client' })).toEqual({ surface: 'client' })
  })

  // Regression: globalHandlers originally sent the script URL as `source`,
  // which collides with the `source: 'client'` marker ingestClientLogs stamps
  // on every relayed entry — so the sanitizer silently dropped the one field
  // that says which bundle threw. It travels as `script_url` for that reason.
  it('preserves the script URL the browser handler actually sends', () => {
    expect(sanitizeContext({ script_url: 'https://x/app.js', line: 1, column: 2 })).toEqual({
      script_url: 'https://x/app.js',
      line: 1,
      column: 2,
    })
  })

  it('a hostile context never fails the batch it travels in', () => {
    const hostile = entry({ context: { nested: { a: 1 }, level: 'debug', blob: 'x'.repeat(5_000) } })
    expect(logIngestSchema.safeParse({ entries: [entry(), hostile] }).success).toBe(true)
  })

  it('the ingest path applies it, so reserved fields survive intact', () => {
    const logger = fakeLogger()
    ingestClientLogs(
      { logger, rateLimiter: createSlidingWindowLimiter(10, 60_000), clientIp: '1.2.3.4' },
      {
        entries: [
          {
            timestamp: '2026-08-02T00:00:00.000Z',
            level: 'error',
            message: 'client.uncaught_error',
            context: { level: 'debug', message: 'ATTACKER', service: 'other', surface: 'client' },
          },
        ],
      },
    )

    const [message, , context] = vi.mocked(logger.error).mock.calls[0] ?? []
    expect(message).toBe('client.uncaught_error')
    expect(context).not.toHaveProperty('level')
    expect(context).toMatchObject({ surface: 'client', source: 'client' })
  })
})

describe('ingestClientLogs', () => {
  it('writes an error entry through the server logger with client provenance', () => {
    const logger = fakeLogger()
    const result = ingestClientLogs(
      { logger, rateLimiter: createSlidingWindowLimiter(10, 60_000), clientIp: '1.2.3.4' },
      {
        entries: [
          {
            timestamp: '2026-08-02T00:00:00.000Z',
            level: 'error',
            service: 'rh-cca',
            message: 'client.uncaught_error',
            context: { surface: 'client', pathname: '/t/0xabc' },
            error: { message: 'boom', stack: 'Error: boom\n  at x' },
          },
        ],
      },
    )

    expect(result).toEqual({ success: true })
    expect(logger.error).toHaveBeenCalledTimes(1)

    const [message, error, context] = vi.mocked(logger.error).mock.calls[0] ?? []
    expect(message).toBe('client.uncaught_error')
    expect((error as Error).message).toBe('boom')
    expect((error as Error).stack).toBe('Error: boom\n  at x')
    expect(context).toMatchObject({
      surface: 'client',
      pathname: '/t/0xabc',
      source: 'client',
      client_service: 'rh-cca',
    })
  })

  // Same hazard as the telemetry sink's `toError`: rebuilding the relayed error
  // with `new Error(...)` captures a stack pointing at THIS function, so a
  // client entry that arrived without one would be shipped with a fabricated
  // stack rooted in the ingest handler. Error Tracking groups on top frames, so
  // every stackless relayed report would collapse into one issue blaming the
  // log-ingest route.
  it('keeps a relayed entry that arrived without a stack stackless', () => {
    const logger = fakeLogger()
    ingestClientLogs(
      { logger, rateLimiter: createSlidingWindowLimiter(10, 60_000), clientIp: '1.2.3.4' },
      {
        entries: [
          {
            timestamp: '2026-08-02T00:00:00.000Z',
            level: 'error',
            message: 'client.unhandled_rejection',
            error: { message: 'rejected with a string' },
          },
        ],
      },
    )

    const [, error] = vi.mocked(logger.error).mock.calls[0] ?? []
    expect((error as Error).stack).toBeUndefined()
    expect((error as Error).stack ?? '').not.toMatch(/ingestClientLogs|router\.ts/)
  })

  it('routes non-error levels to the matching logger method', () => {
    const logger = fakeLogger()
    ingestClientLogs(
      { logger, rateLimiter: createSlidingWindowLimiter(10, 60_000), clientIp: '1.2.3.4' },
      { entries: [{ timestamp: 'now', level: 'warn', message: 'a warning' }] },
    )

    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('drops the batch once the per-IP limit is exceeded', () => {
    const logger = fakeLogger()
    const rateLimiter = createSlidingWindowLimiter(2, 60_000)
    const deps = { logger, rateLimiter, clientIp: '1.2.3.4' }
    const input = { entries: [{ timestamp: 'now', level: 'error' as const, message: 'spam' }] }

    expect(ingestClientLogs(deps, input).success).toBe(true)
    expect(ingestClientLogs(deps, input).success).toBe(true)
    expect(ingestClientLogs(deps, input).success).toBe(false)
    expect(logger.error).toHaveBeenCalledTimes(2)
  })

  it('limits per IP, so one noisy client does not silence another', () => {
    const logger = fakeLogger()
    const rateLimiter = createSlidingWindowLimiter(1, 60_000)
    const input = { entries: [{ timestamp: 'now', level: 'error' as const, message: 'x' }] }

    ingestClientLogs({ logger, rateLimiter, clientIp: '1.1.1.1' }, input)
    expect(ingestClientLogs({ logger, rateLimiter, clientIp: '1.1.1.1' }, input).success).toBe(false)
    expect(ingestClientLogs({ logger, rateLimiter, clientIp: '2.2.2.2' }, input).success).toBe(true)
  })
})

describe('per-request volume ceiling', () => {
  function batch(entries: number, stackChars: number): Parameters<typeof ingestClientLogs>[1] {
    return {
      entries: Array.from({ length: entries }, () => ({
        timestamp: '2026-08-02T00:00:00.000Z',
        level: 'error' as const,
        service: 'rh-cca',
        message: 'client.uncaught_error',
        error: { message: 'boom', stack: 'x'.repeat(stackChars) },
      })),
    }
  }

  function ingest(input: Parameters<typeof ingestClientLogs>[1]): { success: boolean; writes: number } {
    const logger = fakeLogger()
    const result = ingestClientLogs(
      { logger, rateLimiter: createSlidingWindowLimiter(1_000, 60_000), clientIp: '1.2.3.4' },
      input,
    )
    return { success: result.success, writes: vi.mocked(logger.error).mock.calls.length }
  }

  it('accepts a realistic full batch — ~1.4KB an entry, so ~67KB for 50', () => {
    const realistic = batch(50, 900)
    expect(requestBytes(realistic)).toBeLessThan(256 * 1024)
    expect(ingest(realistic).success).toBe(true)
  })

  it('rejects the worst case the schema admits, writing nothing', () => {
    // 50 × (10k stack + 2k message) ≈ what the reviewer costed at ~2.3MB.
    const worstCase = batch(50, 10_000)
    expect(requestBytes(worstCase)).toBeGreaterThan(256 * 1024)

    const { success, writes } = ingest(worstCase)
    expect(success).toBe(false)
    expect(writes).toBe(0)
  })

  it('rejects rather than truncates, so no partially-written batch lands', () => {
    const { writes } = ingest(batch(50, 10_000))
    expect(writes).toBe(0)
  })

  it('an oversized request still consumes the caller window, so it is not free to repeat', () => {
    const logger = fakeLogger()
    const rateLimiter = createSlidingWindowLimiter(2, 60_000)
    const deps = { logger, rateLimiter, clientIp: '1.2.3.4' }
    const oversized = batch(50, 10_000)

    expect(ingestClientLogs(deps, oversized).success).toBe(false)
    expect(ingestClientLogs(deps, oversized).success).toBe(false)
    // Budget spent on the two rejected requests — a legitimate one now waits.
    expect(rateLimiter.isLimited('1.2.3.4')).toBe(true)
  })

  it('counts real bytes, not string length, so multi-byte payloads cannot slip past', () => {
    const ascii = { entries: [{ timestamp: 't', level: 'error' as const, message: 'a'.repeat(100) }] }
    const multiByte = { entries: [{ timestamp: 't', level: 'error' as const, message: 'é'.repeat(100) }] }
    expect(requestBytes(multiByte)).toBeGreaterThan(requestBytes(ascii))
  })
})

describe('stack resolution', () => {
  const resolver = { resolve: vi.fn((stack: string) => `resolved(${stack})`) }

  function ingestError(error: { message: string; stack?: string }): Error | undefined {
    const logger = fakeLogger()
    ingestClientLogs(
      { logger, rateLimiter: createSlidingWindowLimiter(10, 60_000), clientIp: '1.2.3.4', stackResolver: resolver },
      { entries: [{ timestamp: 'now', level: 'error', message: 'client.uncaught_error', error }] },
    )
    return vi.mocked(logger.error).mock.calls[0]?.[1] as Error | undefined
  }

  it('maps a relayed stack through the resolver', () => {
    expect(ingestError({ message: 'boom', stack: 'Error: boom\n  at a.js:1:1' })?.stack).toBe(
      'resolved(Error: boom\n  at a.js:1:1)',
    )
  })

  it('leaves a stackless entry stackless rather than resolving the ingest frame', () => {
    resolver.resolve.mockClear()
    expect(ingestError({ message: 'rejected with a string' })?.stack).toBeUndefined()
    expect(resolver.resolve).not.toHaveBeenCalled()
  })
})
