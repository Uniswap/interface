/**
 * BufferedTransport
 *
 * Wraps any LogTransport with batching. Flushes when the buffer
 * hits maxSize, the timer expires, or the page becomes hidden.
 */

import type { LogEntry, LogTransport } from '../types'

export interface BufferedTransportOptions {
  maxSize?: number
  flushIntervalMs?: number
}

const DEFAULT_MAX_SIZE = 10
const DEFAULT_FLUSH_INTERVAL_MS = 5_000

export function createBufferedTransport(inner: LogTransport, options?: BufferedTransportOptions): LogTransport {
  const maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE
  const flushIntervalMs = options?.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS

  let buffer: LogEntry[] = []
  let timer: ReturnType<typeof setTimeout> | null = null

  function flush(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    if (buffer.length === 0) {
      return
    }
    const batch = buffer
    buffer = []
    inner.send(batch)
  }

  function scheduleFlush(): void {
    if (timer !== null) {
      return
    }
    timer = setTimeout(flush, flushIntervalMs)
  }

  // Flush on page hide (tab switch, navigation, close)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flush()
      }
    })
  }

  return {
    send(entries): void {
      buffer.push(...entries)
      if (buffer.length >= maxSize) {
        flush()
      } else {
        scheduleFlush()
      }
    },
  }
}
