/**
 * TrpcLogTransport
 *
 * Sends log entries to the server via a tRPC mutation.
 * Fire-and-forget — errors are silently swallowed.
 */

import type { LogEntry, LogTransport } from '../types'

export interface LogIngestionClient {
  logs: { ingest: { mutate: (input: { entries: LogEntry[] }) => Promise<unknown> } }
}

export function createTrpcLogTransport(client: LogIngestionClient): LogTransport {
  return {
    send(entries): void {
      client.logs.ingest.mutate({ entries }).catch(() => {})
    },
  }
}
