/**
 * `logs.ingest` — the browser's route into the server log stream, minus the
 * route. Each app wires `logIngestSchema` + `ingestClientLogs` into its own
 * tRPC procedure and supplies the client key (how a client IP is attested is a
 * property of the deployment, not of this package).
 *
 * The endpoint is unauthenticated and writes into the process's stdout, so
 * every bound here is enforced server-side regardless of what the client
 * claims to have sent.
 */

import { z } from 'zod'
import { MAX_MESSAGE_CHARS, MAX_STACK_CHARS } from './logRecord'
import type { RateLimiter } from './rateLimit/createSlidingWindowLimiter'
import type { StackResolver } from './sourceMapResolver'
import type { Logger } from './types'

/**
 * Per-request volume ceiling. Composes with the request-count limit into a
 * volume bound — bytes-per-request × requests-per-window — so no per-window
 * byte accounting is needed while request count stays bounded.
 *
 * Sized against a realistic batch (~1.4 KB an entry, ~67 KB for a full 50),
 * not against what the schema admits. Oversized batches are rejected rather
 * than truncated: a truncated batch is a silently corrupted record, and the
 * client can retry with a smaller one.
 */
export const MAX_REQUEST_BYTES = 256 * 1024

const MAX_CONTEXT_KEYS = 32
const MAX_CONTEXT_KEY_CHARS = 64
const MAX_CONTEXT_VALUE_CHARS = 1_024

type ContextValue = string | number | boolean | null

/**
 * Keys a caller may not set, because context is spread LAST into the record
 * and would otherwise overwrite fields the record owns.
 *
 * The rest are Datadog's default remap aliases for the reserved attributes
 * (status, message, host, date, service): Datadog rewrites them during
 * ingestion, and a NUMERIC `status` or `severity` silently downgrades the
 * record's severity — an error would stop appearing in error-level views. The
 * logger itself emits `level`, so the only way one arrives is from a caller.
 * Matched case-insensitively, so `Timestamp` and `Status` are caught too.
 */
const RESERVED_CONTEXT_KEYS = new Set([
  'timestamp',
  'level',
  'service',
  'message',
  'error',
  'source',
  'client_service',
  'client_timestamp',
  'status',
  'severity',
  'msg',
  'log',
  'host',
  'hostname',
  'env',
  'ddsource',
  'ddtags',
  'trace_id',
  'span_id',
  'date',
  '_timestamp',
  'eventtime',
  'published_date',
])

const RESERVED_KEY_PREFIXES = ['dd.', 'syslog.']

function isReservedKey(key: string): boolean {
  const lowered = key.toLowerCase()
  return RESERVED_CONTEXT_KEYS.has(lowered) || RESERVED_KEY_PREFIXES.some((prefix) => lowered.startsWith(prefix))
}

function isAcceptableValue(value: unknown): value is ContextValue {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

/**
 * Reduces untrusted client context to bounded flat primitives.
 *
 * Drops — rather than rejects — anything out of contract: a reserved key, a
 * nested object or array, an oversized key or value, or a key past the count
 * limit. Dropping keeps one bad key from failing the whole batch it travels in.
 */
export function sanitizeContext(context: Record<string, unknown> | undefined): Record<string, ContextValue> {
  if (!context) {
    return {}
  }
  const safe: Record<string, ContextValue> = {}
  for (const [key, value] of Object.entries(context)) {
    if (Object.keys(safe).length >= MAX_CONTEXT_KEYS) {
      break
    }
    if (isReservedKey(key) || key.length > MAX_CONTEXT_KEY_CHARS || !isAcceptableValue(value)) {
      continue
    }
    if (typeof value === 'string' && value.length > MAX_CONTEXT_VALUE_CHARS) {
      continue
    }
    safe[key] = value
  }
  return safe
}

const logEntrySchema = z.object({
  timestamp: z.string().max(40),
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
  service: z.string().max(100).optional(),
  message: z.string().max(MAX_MESSAGE_CHARS),
  // Kept as `unknown` so the input type stays compatible with LogEntry
  // (createTrpcLogTransport). The bound is enforced by sanitizeContext at write
  // time, which drops offenders instead of failing the batch.
  context: z.record(z.string(), z.unknown()).optional(),
  error: z
    .object({
      message: z.string().max(MAX_MESSAGE_CHARS),
      stack: z.string().max(MAX_STACK_CHARS).optional(),
    })
    .optional(),
})

export const logIngestSchema = z.object({
  entries: z.array(logEntrySchema).max(50),
})

export type LogIngestInput = z.infer<typeof logIngestSchema>

export interface IngestDeps {
  logger: Logger
  rateLimiter: RateLimiter
  /** Rate-limit key. Must be attested by the infrastructure, never by the caller. */
  clientIp: string
  /** Maps minified client stack frames back to source, when the app ships source maps. */
  stackResolver?: StackResolver
}

/**
 * Payload size in real UTF-8 bytes.
 *
 * Sums each string in place rather than serializing: `JSON.stringify` would
 * allocate a second full copy of precisely the oversized payload the ceiling
 * exists to reject. `content-length` would be cheaper still but is not usable
 * — it is caller-supplied, and under `content-encoding` it measures the
 * compressed size, so a small compressed body could carry a large one.
 *
 * Counts the strings that reach the log; structural JSON overhead is ignored,
 * which the ceiling's headroom absorbs.
 */
export function requestBytes(input: LogIngestInput): number {
  let bytes = 0
  for (const entry of input.entries) {
    bytes += Buffer.byteLength(entry.message) + Buffer.byteLength(entry.timestamp)
    if (entry.service) {
      bytes += Buffer.byteLength(entry.service)
    }
    if (entry.error) {
      bytes += Buffer.byteLength(entry.error.message)
      if (entry.error.stack) {
        bytes += Buffer.byteLength(entry.error.stack)
      }
    }
    for (const [key, value] of Object.entries(entry.context ?? {})) {
      bytes += Buffer.byteLength(key)
      if (typeof value === 'string') {
        bytes += Buffer.byteLength(value)
      }
    }
  }
  return bytes
}

/**
 * Writes client-reported entries into the server logger. Rejections are
 * silent on purpose: a record per rejected request would let a flood past the
 * limit write into stdout anyway.
 */
export function ingestClientLogs(
  { logger, rateLimiter, clientIp, stackResolver }: IngestDeps,
  input: LogIngestInput,
): { success: boolean } {
  if (rateLimiter.isLimited(clientIp)) {
    return { success: false }
  }
  // Recorded BEFORE the size check, so oversized requests still consume the
  // caller's window rather than being free to repeat.
  rateLimiter.record(clientIp)

  if (requestBytes(input) > MAX_REQUEST_BYTES) {
    return { success: false }
  }

  for (const entry of input.entries) {
    const context = {
      ...sanitizeContext(entry.context),
      source: 'client' as const,
      client_service: entry.service,
      client_timestamp: entry.timestamp,
    }

    if (entry.level === 'error' || entry.level === 'fatal') {
      let error: Error | undefined
      if (entry.error) {
        error = new Error(entry.error.message)
        // Unconditional: `new Error` captures a stack HERE, so assigning only
        // when the relayed entry carried one would attribute every stackless
        // client report to this ingest handler. Error Tracking groups on top
        // frames, so that collapses them into one issue pointing at the log
        // route. A missing stack must stay missing.
        const { stack } = entry.error
        error.stack = stack && stackResolver ? stackResolver.resolve(stack) : stack
      }
      logger[entry.level](entry.message, error, context)
    } else {
      logger[entry.level](entry.message, context)
    }
  }

  return { success: true }
}
