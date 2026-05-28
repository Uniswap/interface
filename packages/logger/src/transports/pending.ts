/**
 * PendingTransport
 *
 * Buffers log entries until a real transport is connected.
 * Used as the initial transport so client code can log before
 * the tRPC client (or any real transport) is available.
 */

import type { LogTransport } from '../types'

export interface PendingTransport extends LogTransport {
  connect(transport: LogTransport): void
}

const DEFAULT_MAX_BUFFER = 100

export function createPendingTransport(maxBuffer: number = DEFAULT_MAX_BUFFER): PendingTransport {
  let buffer: Parameters<LogTransport['send']>[0] = []
  let delegate: LogTransport | null = null

  return {
    send(entries): void {
      if (delegate) {
        delegate.send(entries)
        return
      }
      buffer.push(...entries)
      // Drop oldest entries if buffer exceeds max
      if (buffer.length > maxBuffer) {
        buffer = buffer.slice(buffer.length - maxBuffer)
      }
    },

    connect(transport): void {
      delegate = transport
      if (buffer.length > 0) {
        transport.send(buffer)
        buffer = []
      }
    },
  }
}
