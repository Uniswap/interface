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

export async function trace<T>(
  name: string,
  callback: (transaction: Transaction) => Promise<T>,
  metadata: TraceMetadata
): Promise<T> {
  const transaction = Sentry.startTransaction({ name, data: metadata.data, tags: metadata.tags })
  try {
    return await callback(transaction)
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
