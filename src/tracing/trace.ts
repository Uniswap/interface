import * as Sentry from '@sentry/react'
import { Span, Transaction } from '@sentry/types'

interface TraceMetadata {
  data?: Record<string, unknown>
  tags?: Record<string, string | number | boolean>
}

interface TraceCallbackOptions {
  traceChild<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T>
  setTraceData(key: string, value: unknown): void
  setTraceTag(key: string, value: string | number | boolean): void
  setTraceStatus(status: number | string): void
  setTraceError(status: number | string, error?: unknown): void
}
type TraceCallback<T> = (options: TraceCallbackOptions) => Promise<T>

function traceTransaction(transaction: Transaction | Span) {
  return async function boundTrace<T>(name: string, callback: TraceCallback<T>): Promise<T> {
    const setTraceStatus = (status: number | string) => {
      if (typeof status === 'number') {
        transaction.setHttpStatus(status)
      } else {
        transaction.setStatus(status)
      }
    }

    try {
      return await callback({
        traceChild(name, callback, metadata) {
          const child = transaction.startChild({ ...metadata, op: name })
          return traceTransaction(child)(name, callback)
        },
        setTraceData: transaction.setData.bind(transaction),
        setTraceTag: transaction.setTag.bind(transaction),
        setTraceStatus,
        setTraceError(status, error) {
          setTraceStatus(status)
          if (error) transaction.setData('error', error)
        },
      })
    } catch (error) {
      if (!transaction.status) transaction.setStatus('unknown_error')
      if (!transaction.data.error) transaction.setData('error', error)
      throw error
    } finally {
      transaction.finish()
    }
  }
}

export async function trace<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T> {
  const transaction = Sentry.startTransaction({ name, data: metadata?.data, tags: metadata?.tags })
  return traceTransaction(transaction)(name, callback)
}
