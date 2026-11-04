import { Code, ConnectError } from '@connectrpc/connect'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getConnectQueryRetryDelay,
  getConnectRetryAfterMs,
  isConnectUnavailableError,
  isTerminalConnectError,
  MAX_RETRIES_DEFAULT,
  MAX_RETRIES_UNAVAILABLE,
  shouldRetryConnectQuery,
} from './retry'

// Mirrors the backend's swrStampedeToConnectError: the lock-loser response for a cold cache key.
const stampede = new ConnectError(
  'Data is being fetched by another request. Please retry with exponential backoff.',
  Code.Unavailable,
  { 'retry-after-ms': '300', 'expected-ready-ms': '2000' },
)
const unavailableWithoutHint = new ConnectError('unavailable', Code.Unavailable)
const invalidArgument = new ConnectError('bad request', Code.InvalidArgument)
const internalError = new ConnectError('upstream blew up', Code.Internal)
const plainError = new Error('network')

const TERMINAL_CODES = [
  Code.InvalidArgument,
  Code.NotFound,
  Code.AlreadyExists,
  Code.PermissionDenied,
  Code.Unauthenticated,
  Code.FailedPrecondition,
  Code.OutOfRange,
  Code.Unimplemented,
]
const TRANSIENT_CODES = [
  Code.Unknown,
  Code.DeadlineExceeded,
  Code.ResourceExhausted,
  Code.Aborted,
  Code.Internal,
  Code.Unavailable,
  Code.DataLoss,
]

describe(isConnectUnavailableError, () => {
  it('matches only ConnectErrors with Code.Unavailable', () => {
    expect(isConnectUnavailableError(stampede)).toBe(true)
    expect(isConnectUnavailableError(unavailableWithoutHint)).toBe(true)
    expect(isConnectUnavailableError(invalidArgument)).toBe(false)
    expect(isConnectUnavailableError(plainError)).toBe(false)
  })
})

describe(isTerminalConnectError, () => {
  it('matches the codes a retry of the same request cannot fix', () => {
    for (const code of TERMINAL_CODES) {
      expect(isTerminalConnectError(new ConnectError('x', code))).toBe(true)
    }
  })

  it('leaves transient codes and non-Connect errors retryable', () => {
    for (const code of TRANSIENT_CODES) {
      expect(isTerminalConnectError(new ConnectError('x', code))).toBe(false)
    }
    expect(isTerminalConnectError(plainError)).toBe(false)
  })
})

describe(getConnectRetryAfterMs, () => {
  it('reads the retry-after-ms metadata the stampede path sets', () => {
    expect(getConnectRetryAfterMs(stampede)).toBe(300)
  })

  it('is undefined when the metadata is absent, unparseable, or negative', () => {
    expect(getConnectRetryAfterMs(unavailableWithoutHint)).toBeUndefined()
    expect(
      getConnectRetryAfterMs(new ConnectError('x', Code.Unavailable, { 'retry-after-ms': 'soon' })),
    ).toBeUndefined()
    expect(getConnectRetryAfterMs(new ConnectError('x', Code.Unavailable, { 'retry-after-ms': '-1' }))).toBeUndefined()
    expect(getConnectRetryAfterMs(plainError)).toBeUndefined()
  })
})

describe(shouldRetryConnectQuery, () => {
  it('gives Code.Unavailable the larger retry budget', () => {
    expect(shouldRetryConnectQuery(MAX_RETRIES_UNAVAILABLE - 1, stampede)).toBe(true)
    expect(shouldRetryConnectQuery(MAX_RETRIES_UNAVAILABLE, stampede)).toBe(false)
  })

  it('never retries a deterministic error, not even once', () => {
    for (const code of TERMINAL_CODES) {
      expect(shouldRetryConnectQuery(0, new ConnectError('x', code))).toBe(false)
    }
  })

  it('keeps the default budget for other transient and non-Connect errors', () => {
    expect(shouldRetryConnectQuery(MAX_RETRIES_DEFAULT - 1, internalError)).toBe(true)
    expect(shouldRetryConnectQuery(MAX_RETRIES_DEFAULT, internalError)).toBe(false)
    expect(shouldRetryConnectQuery(MAX_RETRIES_DEFAULT - 1, plainError)).toBe(true)
    expect(shouldRetryConnectQuery(MAX_RETRIES_DEFAULT, plainError)).toBe(false)
  })

  it('the Unavailable budget is strictly larger than the default one', () => {
    expect(MAX_RETRIES_UNAVAILABLE).toBeGreaterThan(MAX_RETRIES_DEFAULT)
  })
})

describe(getConnectQueryRetryDelay, () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('doubles the equal-jitter window per failure: [w/2, w] with w = 500ms · 2^failureCount', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(getConnectQueryRetryDelay(0, unavailableWithoutHint)).toBe(250)
    expect(getConnectQueryRetryDelay(1, unavailableWithoutHint)).toBe(500)
    expect(getConnectQueryRetryDelay(2, unavailableWithoutHint)).toBe(1_000)

    vi.spyOn(Math, 'random').mockReturnValue(0.999_999)
    expect(getConnectQueryRetryDelay(0, unavailableWithoutHint)).toBeLessThan(500)
    expect(getConnectQueryRetryDelay(0, unavailableWithoutHint)).toBeGreaterThan(499)
    expect(getConnectQueryRetryDelay(2, unavailableWithoutHint)).toBeLessThan(2_000)
  })

  it('caps the window at 8s', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(getConnectQueryRetryDelay(4, unavailableWithoutHint)).toBe(4_000)
    expect(getConnectQueryRetryDelay(5, unavailableWithoutHint)).toBe(4_000)
    expect(getConnectQueryRetryDelay(20, unavailableWithoutHint)).toBe(4_000)
    vi.spyOn(Math, 'random').mockReturnValue(0.999_999)
    expect(getConnectQueryRetryDelay(20, unavailableWithoutHint)).toBeLessThan(8_000)
  })

  it('never retries sooner than the server retry-after-ms hint', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const slowFill = new ConnectError('x', Code.Unavailable, { 'retry-after-ms': '3000' })
    expect(getConnectQueryRetryDelay(0, slowFill)).toBe(3_000)
    // A hint shorter than the schedule doesn't shorten it.
    expect(getConnectQueryRetryDelay(0, stampede)).toBe(300)
    expect(getConnectQueryRetryDelay(1, stampede)).toBe(500)
  })

  it('keeps jittering on top of a hint that exceeds the window, so lock losers still spread out', () => {
    const slowFill = new ConnectError('x', Code.Unavailable, { 'retry-after-ms': '3000' })
    vi.spyOn(Math, 'random').mockReturnValue(0.999_999)
    expect(getConnectQueryRetryDelay(0, slowFill)).toBeGreaterThan(3_000)
    expect(getConnectQueryRetryDelay(0, slowFill)).toBeLessThan(3_250)
  })

  it('caps the hint at the 8s ceiling', () => {
    const stuckLock = new ConnectError('x', Code.Unavailable, { 'retry-after-ms': '60000' })
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(getConnectQueryRetryDelay(0, stuckLock)).toBe(8_000)
    expect(getConnectQueryRetryDelay(5, stuckLock)).toBe(8_000)
  })

  it('uses the same schedule for non-Unavailable errors', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(getConnectQueryRetryDelay(0, plainError)).toBe(250)
    expect(getConnectQueryRetryDelay(1, internalError)).toBe(500)
  })
})
