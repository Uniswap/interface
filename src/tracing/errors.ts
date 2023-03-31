import * as Sentry from '@sentry/react'

export function onerror(event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) {
  // We still send handled/mechanism tags despite using our own handler. These errors are still unhandled.
  const tags = { handled: 'no', mechanism: 'onerror' }
  Sentry.captureException(error ?? event, { tags })
}

export function onunhandledrejection({ reason }: { reason: unknown }) {
  // We still send handled/mechanism tags despite using our own handler. These rejections are still unhandled.
  const tags = { handled: 'no', mechanism: 'onunhandledrejection' }
  Sentry.captureException(reason, { tags })
}
