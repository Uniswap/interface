import { proto3 } from '@bufbuild/protobuf'
import { toPlainMessage } from '@bufbuild/protobuf'
import type { Query } from '@tanstack/react-query'
import { ListPositionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { sharedDehydrateOptions } from 'uniswap/src/data/apiClients/sharedDehydrateOptions'

// Mock isDevEnv/isTestEnv so we can toggle the runtime guards per-case.
const isDevEnvMock = vi.fn()
const isTestEnvMock = vi.fn()
vi.mock('@universe/environment', () => ({
  isDevEnv: () => isDevEnvMock(),
  isTestEnv: () => isTestEnvMock(),
}))

// Mock the logger so the dev-only warning/error doesn't pollute test output
// and we can assert it fires when expected.
const loggerWarnMock = vi.fn()
const loggerErrorMock = vi.fn()
vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
    error: (...args: unknown[]) => loggerErrorMock(...args),
  },
}))

// Synthetic protobuf-es Message type. `isMessage(...)` recognizes instances, and
// `getType().typeName` returns 'test.SyntheticMessage' — matches a real raw Message.
const SyntheticMessage = proto3.makeMessageType('test.SyntheticMessage', () => [
  { no: 1, name: 'name', kind: 'scalar', T: 9 /* string */ },
])

function makeProtobufMessage(): object {
  return new SyntheticMessage({ name: 'unwrapped' })
}

// Wraps `value` in `levels` nested plain objects. nest(msg, 0) === msg.
function nest(value: unknown, levels: number): unknown {
  let wrapped = value
  for (let i = 0; i < levels; i++) {
    wrapped = { child: wrapped }
  }
  return wrapped
}

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
    isTestEnvMock.mockReturnValue(false)
    loggerWarnMock.mockReset()
    loggerErrorMock.mockReset()
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

    describe('protobuf tripwire (findRawProtobufTypeName)', () => {
      it('excludes a query whose data IS a raw protobuf Message and errors', () => {
        expect(shouldDehydrate(buildQuery({ data: makeProtobufMessage(), meta: { persist: true } }))).toBe(false)
        expect(loggerErrorMock).toHaveBeenCalledOnce()
      })

      it('surfaces the offending typeName in the logged error', () => {
        shouldDehydrate(buildQuery({ data: makeProtobufMessage(), meta: { persist: true } }))
        const [loggedError] = loggerErrorMock.mock.calls[0] as [Error]
        expect(loggedError.message).toContain('test.SyntheticMessage')
      })

      it('detects a Message nested inside a plain object', () => {
        const data = { outer: { inner: makeProtobufMessage() } }
        expect(shouldDehydrate(buildQuery({ data, meta: { persist: true } }))).toBe(false)
        expect(loggerErrorMock).toHaveBeenCalledOnce()
      })

      it('detects a Message nested inside an array', () => {
        const data = { items: [{ ok: true }, makeProtobufMessage()] }
        expect(shouldDehydrate(buildQuery({ data, meta: { persist: true } }))).toBe(false)
        expect(loggerErrorMock).toHaveBeenCalledOnce()
      })

      it('detects a Message at the deepest scanned level (depth 8)', () => {
        expect(shouldDehydrate(buildQuery({ data: nest(makeProtobufMessage(), 8), meta: { persist: true } }))).toBe(
          false,
        )
        expect(loggerErrorMock).toHaveBeenCalledOnce()
      })

      it('does NOT detect a Message buried below the scan depth (depth 9)', () => {
        // Past MAX_PROTOBUF_SCAN_DEPTH the scan gives up; the value still passes
        // the jsonStringify probe (Message.toJSON serializes), so it persists.
        expect(shouldDehydrate(buildQuery({ data: nest(makeProtobufMessage(), 9), meta: { persist: true } }))).toBe(
          true,
        )
        expect(loggerErrorMock).not.toHaveBeenCalled()
      })

      it('does not flag plain serializable data with no Message', () => {
        const data = { a: 1, nested: { b: [2, 3], c: 'x' } }
        expect(shouldDehydrate(buildQuery({ data, meta: { persist: true } }))).toBe(true)
        expect(loggerErrorMock).not.toHaveBeenCalled()
      })

      it('terminates on circular references and still finds a reachable Message', () => {
        const data: Record<string, unknown> = { msg: makeProtobufMessage() }
        data['self'] = data // WeakSet guard must prevent infinite recursion
        expect(shouldDehydrate(buildQuery({ data, meta: { persist: true } }))).toBe(false)
        expect(loggerErrorMock).toHaveBeenCalledOnce()
      })

      it('does not run the protobuf tripwire outside dev/test', () => {
        isDevEnvMock.mockReturnValue(false)
        expect(shouldDehydrate(buildQuery({ data: makeProtobufMessage(), meta: { persist: true } }))).toBe(true)
        expect(loggerErrorMock).not.toHaveBeenCalled()
      })
    })
  })

  describe('raw protobuf Message tripwire', () => {
    beforeEach(() => {
      isDevEnvMock.mockReturnValue(true)
    })

    it('EXCLUDES queries whose data is a raw protobuf Message and logs an error naming the typeName', () => {
      const message = new ListPositionsResponse({})
      expect(shouldDehydrate(buildQuery({ data: message, meta: { persist: true } }))).toBe(false)
      expect(loggerErrorMock).toHaveBeenCalledOnce()
      const [error] = loggerErrorMock.mock.calls[0] as [Error]
      expect(error.message).toContain(ListPositionsResponse.typeName)
    })

    it('EXCLUDES queries with a raw Message nested in an array (infinite-query pages shape)', () => {
      const data = { pages: [new ListPositionsResponse({})], pageParams: [undefined] }
      expect(shouldDehydrate(buildQuery({ data, meta: { persist: true } }))).toBe(false)
      expect(loggerErrorMock).toHaveBeenCalledOnce()
    })

    it('INCLUDES queries whose Message has been converted via toPlainMessage', () => {
      const plain = toPlainMessage(new ListPositionsResponse({}))
      expect(shouldDehydrate(buildQuery({ data: plain, meta: { persist: true } }))).toBe(true)
      expect(loggerErrorMock).not.toHaveBeenCalled()
    })

    it('runs the tripwire in test env even when not dev env', () => {
      isDevEnvMock.mockReturnValue(false)
      isTestEnvMock.mockReturnValue(true)
      expect(shouldDehydrate(buildQuery({ data: new ListPositionsResponse({}), meta: { persist: true } }))).toBe(false)
      expect(loggerErrorMock).toHaveBeenCalledOnce()
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
