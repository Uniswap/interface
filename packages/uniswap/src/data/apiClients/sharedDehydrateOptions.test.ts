import type { Query } from '@tanstack/react-query'
import { sharedDehydrateOptions } from 'uniswap/src/data/apiClients/sharedDehydrateOptions'

// Mock isDevEnv so we can toggle the runtime JSON.stringify guard per-case.
const isDevEnvMock = vi.fn()
vi.mock('@universe/environment', () => ({
  isDevEnv: () => isDevEnvMock(),
}))

// Mock the logger so the dev-only warning doesn't pollute test output and we
// can assert it fires when expected.
const loggerWarnMock = vi.fn()
vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
  },
}))

function buildQuery({
  data,
  meta,
  gcTime = 5 * 60_000,
  queryKey = ['TestKey'],
  status = 'success',
}: {
  data?: unknown
  meta?: Record<string, unknown>
  gcTime?: number
  queryKey?: readonly unknown[]
  status?: 'pending' | 'error' | 'success'
} = {}): Query {
  return {
    queryKey,
    gcTime,
    meta,
    state: { data, status, fetchStatus: 'idle' },
  } as unknown as Query
}

describe('sharedDehydrateOptions.shouldDehydrateQuery', () => {
  const shouldDehydrate = sharedDehydrateOptions!.shouldDehydrateQuery!

  beforeEach(() => {
    isDevEnvMock.mockReturnValue(false)
    loggerWarnMock.mockReset()
  })

  it('excludes queries without meta', () => {
    expect(shouldDehydrate(buildQuery({ data: { ok: true } }))).toBe(false)
  })

  it('excludes queries with meta.persist !== true', () => {
    expect(shouldDehydrate(buildQuery({ data: { ok: true }, meta: { persist: false } }))).toBe(false)
    expect(shouldDehydrate(buildQuery({ data: { ok: true }, meta: {} }))).toBe(false)
    expect(shouldDehydrate(buildQuery({ data: { ok: true }, meta: { persist: 'true' } }))).toBe(false)
  })

  it('excludes queries with gcTime === 0 even if meta.persist is true', () => {
    expect(shouldDehydrate(buildQuery({ data: { ok: true }, meta: { persist: true }, gcTime: 0 }))).toBe(false)
  })

  it('includes queries with meta.persist === true and non-zero gcTime', () => {
    expect(shouldDehydrate(buildQuery({ data: { ok: true }, meta: { persist: true } }))).toBe(true)
  })

  it('excludes non-success queries (defaultShouldDehydrateQuery rejects them)', () => {
    expect(shouldDehydrate(buildQuery({ data: undefined, meta: { persist: true }, status: 'pending' }))).toBe(false)
    expect(shouldDehydrate(buildQuery({ data: undefined, meta: { persist: true }, status: 'error' }))).toBe(false)
  })

  describe('dev-only runtime guard', () => {
    beforeEach(() => {
      isDevEnvMock.mockReturnValue(true)
    })

    it('INCLUDES queries whose data contains bigint (the persister handles it via `__bigint__:` prefix)', () => {
      expect(shouldDehydrate(buildQuery({ data: { amount: BigInt(1) }, meta: { persist: true } }))).toBe(true)
      expect(loggerWarnMock).not.toHaveBeenCalled()
    })

    it('excludes queries whose data contains circular references and warns', () => {
      const circular: Record<string, unknown> = { name: 'x' }
      circular['self'] = circular
      expect(shouldDehydrate(buildQuery({ data: circular, meta: { persist: true } }))).toBe(false)
      expect(loggerWarnMock).toHaveBeenCalledOnce()
    })

    it('documents a known limitation: functions are silently dropped by JSON, not caught by guard', () => {
      // `jsonStringify` / `JSON.stringify` treats functions as undefined rather
      // than throwing. This means a function-containing value will pass the
      // runtime guard but be lossy after round-trip. Documented via this test
      // so nobody is surprised.
      expect(shouldDehydrate(buildQuery({ data: { fn: () => 1 }, meta: { persist: true } }))).toBe(true)
      expect(loggerWarnMock).not.toHaveBeenCalled()
    })

    it('includes queries whose data round-trips cleanly through JSON', () => {
      expect(shouldDehydrate(buildQuery({ data: { a: 1, b: 'x', c: null, d: [1, 2] }, meta: { persist: true } }))).toBe(
        true,
      )
      expect(loggerWarnMock).not.toHaveBeenCalled()
    })

    it('does not run the guard when data is undefined (query still fetching)', () => {
      expect(shouldDehydrate(buildQuery({ data: undefined, meta: { persist: true }, status: 'pending' }))).toBe(false)
      expect(loggerWarnMock).not.toHaveBeenCalled()
    })
  })

  describe('prod runtime guard is skipped', () => {
    it('does not probe jsonStringify when not in dev', () => {
      isDevEnvMock.mockReturnValue(false)
      // Pre-flight guarantee: a circular reference would trip the guard in dev.
      const circular: Record<string, unknown> = { name: 'x' }
      circular['self'] = circular
      // In prod we skip the guard for perf; shouldDehydrateQuery returns true.
      // (The persister ultimately fails the write, but that's outside this unit.)
      expect(shouldDehydrate(buildQuery({ data: circular, meta: { persist: true } }))).toBe(true)
      expect(loggerWarnMock).not.toHaveBeenCalled()
    })
  })
})
