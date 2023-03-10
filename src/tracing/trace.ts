import * as Sentry from '@sentry/react'
import { Transaction } from '@sentry/types'

interface Measurement {
  name: string
  value: number
  unit: string
}

interface TraceMetadata {
  data?: Record<string, unknown>
  tags?: Record<string, string | number | boolean>
}

interface TraceCallbackOptions {
  transaction: Transaction
  traceChild<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T>
}
type TraceCallback<T> = (options: TraceCallbackOptions) => Promise<T>

function traceTransaction(transaction: Transaction) {
  return async function boundTrace<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T> {
    try {
      return await callback({ transaction, traceChild: traceTransaction(transaction) })
    } catch (error) {
      if (!transaction.status) {
        transaction.setStatus('unknown_error')
      }
      if (!transaction.data.error) {
        transaction.setData('error', error)
      }
      throw error
    } finally {
      transaction.finish()
    }
  }
}

export async function trace<T>(name: string, callback: TraceCallback<T>, metadata?: TraceMetadata): Promise<T> {
  const transaction = Sentry.startTransaction({ name, data: metadata?.data, tags: metadata?.tags })
  return traceTransaction(transaction)(name, callback, metadata)
}
