import '@sentry/tracing' // required to populate Sentry.startTransaction, which is not included in the core module

import * as Sentry from '@sentry/react'
import { Transaction } from '@sentry/tracing'
import { ErrorEvent, EventHint } from '@sentry/types'
import assert from 'assert'
import { mocked } from 'test-utils/mocked'

import { beforeSend } from './errors'
import { trace } from './trace'

jest.mock('@sentry/react', () => {
  return {
    startTransaction: jest.fn(),
  }
})

function getTransaction(index = 0): Transaction {
  const transactions = mocked(Sentry.startTransaction).mock.results.map(({ value }) => value)
  expect(transactions).toHaveLength(index + 1)
  const transaction = transactions[index]
  expect(transaction).toBeDefined()
  return transaction
}

describe('trace', () => {
  beforeEach(() => {
    mocked(Sentry.startTransaction).mockImplementation((context) => {
      const transaction: Transaction = jest.requireActual('@sentry/react').startTransaction(context)
      transaction.initSpanRecorder()
      return transaction
    })
  })

  it('propagates callback', async () => {
    await expect(trace('test', () => Promise.resolve('resolved'))).resolves.toBe('resolved')
    await expect(trace('test', () => Promise.reject('rejected'))).rejects.toBe('rejected')
  })

  it('records transaction', async () => {
    const metadata = { data: { a: 'a', b: 2 }, tags: { test_tag: true } }
    // @ts-ignore test_tag is not an expected key for `tags` but force it for testing purposes
    await trace('test', () => Promise.resolve(), metadata)
    const transaction = getTransaction()
    expect(transaction.name).toBe('test')
    expect(transaction.data).toEqual({ a: 'a', b: 2 })
    expect(transaction.tags).toEqual({ test_tag: true })
  })

  describe('defaults status', () => {
    it('"ok" if resolved', async () => {
      await trace('test', () => Promise.resolve())
      const transaction = getTransaction()
      expect(transaction.status).toBe('ok')
    })

    it('"internal_error" if rejected, with data.error set to rejection', async () => {
      const error = new Error('Test error')
      await expect(trace('test', () => Promise.reject(error))).rejects.toBe(error)
      const transaction = getTransaction()
      expect(transaction.status).toBe('internal_error')
      expect(transaction.data).toEqual({ error })
    })
  })

  describe('setTraceData', () => {
    it('sets transaction data', async () => {
      await trace('test', ({ setTraceData }) => {
        setTraceData('a', 'a')
        setTraceData('b', 2)
        return Promise.resolve()
      })
      const transaction = getTransaction()
      expect(transaction.data).toEqual({ a: 'a', b: 2 })
    })
  })

  describe('setTraceTag', () => {
    it('sets a transaction tag', async () => {
      await trace('test', ({ setTraceTag }) => {
        // @ts-ignore test_tag is not an expected key for `tags` but force it for testing purposes
        setTraceTag('test_tag', true)
        return Promise.resolve()
      })
      const transaction = getTransaction()
      expect(transaction.tags).toEqual({ test_tag: true })
    })
  })

  describe('beforeSend', () => {
    it('handles no path', async () => {
      const errorEvent: ErrorEvent = {
        type: undefined,
        request: {
          url: 'https://app.uniswap.org',
        },
      }
      const eventHint: EventHint = {}
      expect((beforeSend(errorEvent, eventHint) as ErrorEvent)?.request?.url).toEqual('https://app.uniswap.org')
    })

    it('handles hash with path', async () => {
      const errorEvent: ErrorEvent = {
        type: undefined,
        request: {
          url: 'https://app.uniswap.org/#/pools',
        },
      }
      const eventHint: EventHint = {}
      expect((beforeSend(errorEvent, eventHint) as ErrorEvent)?.request?.url).toEqual('https://app.uniswap.org/pools')
    })

    it('handles just hash', async () => {
      const errorEvent: ErrorEvent = {
        type: undefined,
        request: {
          url: 'https://app.uniswap.org/#',
        },
      }
      const eventHint: EventHint = {}
      expect((beforeSend(errorEvent, eventHint) as ErrorEvent)?.request?.url).toEqual('https://app.uniswap.org')
    })
  })

  describe('setTraceStatus', () => {
    it('sets a transaction status with a string', async () => {
      await trace('test', ({ setTraceStatus }) => {
        setTraceStatus('cancelled')
        return Promise.resolve()
      })
      let transaction = getTransaction(0)
      expect(transaction.status).toBe('cancelled')

      await expect(
        trace('test', ({ setTraceStatus }) => {
          setTraceStatus('failed_precondition')
          return Promise.reject()
        })
      ).rejects.toBeUndefined()
      transaction = getTransaction(1)
      expect(transaction.status).toBe('failed_precondition')
    })

    it('sets a transaction http status with a number', async () => {
      await trace('test', ({ setTraceStatus }) => {
        setTraceStatus(429)
        return Promise.resolve()
      })
      const transaction = getTransaction()
      expect(transaction.status).toBe('resource_exhausted')
    })
  })

  describe('setTraceError', () => {
    it('sets transaction data.error', async () => {
      const error = new Error('Test error')
      await expect(
        trace('test', ({ setTraceError }) => {
          setTraceError(error)
          return Promise.reject(new Error(`Wrapped ${error.message}`))
        })
      ).rejects.toBeDefined()
      const transaction = getTransaction()
      expect(transaction.data).toEqual({ error })
    })
  })

  describe('traceChild', () => {
    it('starts a span under a transaction', async () => {
      await trace('test', ({ traceChild }) => {
        // @ts-ignore test_tag is not an expected key for `tags` but force it for testing purposes
        traceChild('child', () => Promise.resolve(), { data: { e: 'e' }, tags: { test_tag: true } })
        return Promise.resolve()
      })
      const transaction = getTransaction()
      const span = transaction.spanRecorder?.spans[1]
      assert(span)
      expect(span.op).toBe('child')
      expect(span.data).toEqual({ e: 'e' })
      expect(span.tags).toEqual({ test_tag: true })
    })
  })
})
