import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { Primitive, Transaction } from '@sentry/types'

export { ErrorBoundary } from '@sentry/react'

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'

export function init(options: Omit<Sentry.BrowserOptions, 'integrations'>) {
  return Sentry.init({
    ...options,
    integrations: [
      new BrowserTracing({
        startTransactionOnLocationChange: false,
        startTransactionOnPageLoad: true,
      }),
    ],
  })
}

export async function time<T>(
  name: string,
  callback: (transaction: Transaction) => Promise<T>,
  tags?: Record<string, Primitive>,
  data?: Record<string, any>
): Promise<T> {
  const tx = Sentry.startTransaction({ name, tags, data })

  try {
    return await callback(tx)
  } catch (error: unknown) {
    if (error) {
      tx.setStatus((error as object).toString())
    } else {
      tx.setStatus('unknown_error')
    }
    throw error
  } finally {
    tx.finish()
  }
}

export function log(message: string, severity: Sentry.SeverityLevel) {
  Sentry.captureMessage(message, severity)
  switch (severity) {
    case 'debug':
      return console.debug(message)
    case 'info':
      return console.info(message)
    case 'log':
      return console.log(message)
    case 'warning':
      return console.warn(message)
    case 'error':
    case 'fatal':
      return console.error(message)
  }
}
