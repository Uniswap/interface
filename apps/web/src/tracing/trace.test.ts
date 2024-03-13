import { Span } from '@sentry/core'
import * as Sentry from '@sentry/react'
import { mocked } from 'test-utils/mocked'

import { trace } from './trace'
import { OpCode, TraceContext } from './types'

jest.mock('@sentry/react', () => {
  return {
    startInactiveSpan: jest.fn(),
  }
})

const CONTEXT = { name: 'Test', op: 'Test' as OpCode } as TraceContext

let span: Span | undefined
const spanMap = new Map<string, Span>()

describe('trace', () => {
  beforeEach(() => {
    span = undefined
    spanMap.clear()
    mocked(Sentry.startInactiveSpan).mockImplementation((context) => {
      span = new Span(context)
      const startChild = span.startChild.bind(span)
      span.startChild = (context) => {
        span = startChild(context)
        spanMap.set(span.spanId, span)
        return span
      }
      spanMap.set(span.spanId, span)
      return span
    })
  })

  describe('propagation', () => {
    it('propagates resolved callback', async () => {
      await expect(trace(CONTEXT, () => Promise.resolve('resolved'))).resolves.toBe('resolved')
    })

    it('propagates promise rejection', async () => {
      await expect(trace(CONTEXT, () => Promise.reject('rejected'))).rejects.toBe('rejected')
    })
  })

  it('records span', async () => {
    const metadata = { data: { a: 'a', b: 2 }, tags: { host: 'example.com' } }
    await trace({ ...CONTEXT, ...metadata } as TraceContext, () => Promise.resolve())
    expect(span!.name).toBe(CONTEXT.name)
    expect(span!.op).toBe(CONTEXT.op)
    expect(span!.data).toEqual({ a: 'a', b: 2 })
    expect(span!.tags).toEqual({ host: 'example.com' })
  })

  it('forks a zone with the TraceCallbackContext', async () => {
    await trace(CONTEXT, async (trace) => {
      const context = Zone.current.get('trace')
      expect(context).toBe(trace.child)
    })

    const context = Zone.current.get('trace')
    expect(context).toBeUndefined()
  })

  describe('defaults status', () => {
    it('"ok" if resolved', async () => {
      await trace(CONTEXT, () => Promise.resolve())
      expect(span!.status).toBe('ok')
    })

    it('"unknown_error" if rejected, with data.error set to rejection', async () => {
      const error = new Error('Test error')
      await expect(trace(CONTEXT, () => Promise.reject(error))).rejects.toBe(error)
      expect(span!.status).toBe('unknown_error')
      expect(span!.data).toEqual({ error })
    })

    it('"unknown_error" if thrown, with data.error set to error', async () => {
      const error = new Error('Test error')
      await expect(
        trace(CONTEXT, () => {
          throw error
        })
      ).rejects.toBe(error)
      expect(span!.status).toBe('unknown_error')
      expect(span!.data).toEqual({ error })
    })
  })

  describe('child', () => {
    it('starts a span under a span', async () => {
      await trace(CONTEXT, ({ child }) => {
        child({ name: 'Child', op: 'child' as OpCode } as TraceContext, () => Promise.resolve())
        return Promise.resolve()
      })
      expect(span!.name).toBe('Child')
      expect(span!.op).toBe('child')
      const parent = spanMap.get(span!.parentSpanId!)!
      expect(parent.name).toBe(CONTEXT.name)
      expect(parent.op).toBe(CONTEXT.op)
    })
  })

  describe('setData', () => {
    it('sets span data', async () => {
      await trace(CONTEXT, ({ setData }) => {
        setData('a', 'a')
        setData('b', 2)
        return Promise.resolve()
      })
      expect(span!.data).toEqual({ a: 'a', b: 2 })
    })
  })

  describe('setStatus', () => {
    it('sets a span status with a string', async () => {
      await trace(CONTEXT, ({ setStatus }) => {
        setStatus('cancelled')
        return Promise.resolve()
      })
      expect(span!.status).toBe('cancelled')
    })

    it('sets a span http status with a number', async () => {
      await trace(CONTEXT, ({ setStatus }) => {
        setStatus(429)
        return Promise.resolve()
      })
      expect(span!.status).toBe('resource_exhausted')
    })
  })

  describe('setError', () => {
    it('sets span data.error', async () => {
      const error = new Error('Test error')
      await expect(
        trace(CONTEXT, ({ setError }) => {
          setError(error)
          return Promise.reject(error)
        })
      ).rejects.toBeDefined()
      expect(span!.status).toEqual('unknown_error')
      expect(span!.data).toEqual({ error })
    })

    it('sets span status', async () => {
      const error = new Error('Test error')
      await expect(
        trace(CONTEXT, ({ setError }) => {
          setError(error, 'cancelled')
          return Promise.reject(error)
        })
      ).rejects.toBeDefined()
      expect(span!.status).toEqual('cancelled')
      expect(span!.data).toEqual({ error })
    })
  })

  describe('now', () => {
    beforeAll(() => {
      jest.useFakeTimers()
      performance.measure = jest.fn()
    })
    afterAll(() => jest.useRealTimers())

    it('returns elapsed', async () => {
      await trace(CONTEXT, ({ now }) => {
        jest.advanceTimersByTime(500)
        const elapsedMs = now()
        expect(elapsedMs).toBe(500)
        return Promise.resolve()
      })
    })
  })
})
