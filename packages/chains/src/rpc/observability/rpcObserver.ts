import { logger } from 'utilities/src/logger/logger'
import { extractProviderName } from './extractProviderName'

export interface RpcRequestContext {
  requestId: string
  method: string
  params: unknown
  chainId: number
  url: string
  transport: 'viem' | 'ethers' | 'solana'
}

export interface RpcResponseContext extends RpcRequestContext {
  durationMs: number
}

export interface RpcErrorContext extends RpcRequestContext {
  durationMs: number
  error: unknown
  errorCategory?: string
}

export interface RpcObserver {
  onRequest: (ctx: RpcRequestContext) => void
  onResponse: (ctx: RpcResponseContext) => void
  onError: (ctx: RpcErrorContext) => void
}

export const noopObserver: RpcObserver = {
  onRequest: () => {},
  onResponse: () => {},
  onError: () => {},
}

// Rate limiting for error telemetry: per (provider, chainId), allow up to
// MAX_ERRORS_PER_WINDOW logs in each ERROR_WINDOW_MS window. Suppressed
// errors are counted and emitted as a single summary on the first error of
// the next window. A provider that goes silent after a burst leaves its
// suppressed count stranded until a subsequent error opens a new window;
// stranded counts are lost on page unload (no beforeunload flush).
const ERROR_WINDOW_MS = 60_000
const MAX_ERRORS_PER_WINDOW = 5
// Cap unique keys collected per bucket. RPC error messages can have
// unbounded cardinality (request bodies, URLs, IDs embedded in the
// message), and the summary log payload must stay below Datadog's
// per-log size limit. 20 covers typical RPC method cardinality (~10
// distinct methods in practice) plus headroom for distinct error
// variants; overflow keys are aggregated under "<other>".
const MAX_KEYS_PER_BUCKET = 20

interface ErrorBucket {
  count: number
  suppressed: number
  /** Monotonic time (`performance.now()`) when the window started. */
  windowStart: number
  /** method → count of suppressed errors. Capped at MAX_KEYS_PER_BUCKET. */
  methods: Record<string, number>
  /** error message → count of suppressed errors. Capped at MAX_KEYS_PER_BUCKET. */
  errors: Record<string, number>
}

const errorBuckets = new Map<string, ErrorBucket>()

/** Test-only: clears the module-level rate-limit state between cases. */
export function resetErrorBuckets(): void {
  errorBuckets.clear()
}

function createBucket(now: number): ErrorBucket {
  return { count: 1, suppressed: 0, windowStart: now, methods: {}, errors: {} }
}

function incrementCappedKey(map: Record<string, number>, key: string): void {
  if (map[key] !== undefined) {
    map[key]++
    return
  }
  if (Object.keys(map).length < MAX_KEYS_PER_BUCKET) {
    map[key] = 1
    return
  }
  map['<other>'] = (map['<other>'] ?? 0) + 1
}

interface ShouldLogResult {
  log: boolean
  /** Summary from the previous window, if it had suppressed errors. */
  previousSummary?: { suppressed: number; methods: Record<string, number>; errors: Record<string, number> }
}

function shouldLogError({
  provider,
  chainId,
  method,
  error,
}: {
  provider: string
  chainId: number
  method: string
  error: string
}): ShouldLogResult {
  const key = `${provider}:${chainId}`
  // `performance.now()` is monotonic — wall-clock jumps (NTP, suspend/resume)
  // would otherwise break window math.
  const now = performance.now()
  const bucket = errorBuckets.get(key)

  if (!bucket || now - bucket.windowStart >= ERROR_WINDOW_MS) {
    const previousSummary =
      bucket && bucket.suppressed > 0
        ? { suppressed: bucket.suppressed, methods: bucket.methods, errors: bucket.errors }
        : undefined
    errorBuckets.set(key, createBucket(now))
    return { log: true, previousSummary }
  }

  bucket.count++
  if (bucket.count <= MAX_ERRORS_PER_WINDOW) {
    return { log: true }
  }

  bucket.suppressed++
  incrementCappedKey(bucket.methods, method)
  incrementCappedKey(bucket.errors, error)
  return { log: false }
}

function createDatadogRpcObserver(): RpcObserver {
  return {
    onRequest: (): void => {},
    onResponse: (ctx: RpcResponseContext): void => {
      logger.info('rpcObserver', 'onResponse', 'RPC response', {
        method: ctx.method,
        chainId: ctx.chainId,
        durationMs: Math.round(ctx.durationMs),
        provider: extractProviderName(ctx.url),
        transport: ctx.transport,
      })
    },
    onError: (ctx: RpcErrorContext): void => {
      const provider = extractProviderName(ctx.url)
      const errorMessage = ctx.error instanceof Error ? ctx.error.message : String(ctx.error)
      const { log, previousSummary } = shouldLogError({
        provider,
        chainId: ctx.chainId,
        method: ctx.method,
        error: errorMessage,
      })

      if (previousSummary) {
        logger.warn(
          'rpcObserver',
          'onError',
          `Suppressed ${previousSummary.suppressed} RPC errors in previous ${ERROR_WINDOW_MS / 1000}s window`,
          {
            provider,
            chainId: ctx.chainId,
            methods: previousSummary.methods,
            errors: previousSummary.errors,
          },
        )
      }

      if (log) {
        logger.warn('rpcObserver', 'onError', 'RPC error', {
          method: ctx.method,
          chainId: ctx.chainId,
          durationMs: Math.round(ctx.durationMs),
          provider,
          transport: ctx.transport,
          error: errorMessage,
        })
      }
    },
  }
}

let counter = 0
export function generateRequestId(): string {
  return `rpc-${++counter}`
}

let observer: RpcObserver = createDatadogRpcObserver()

export function getRpcObserver(): RpcObserver {
  return observer
}

export function setRpcObserver(obs: RpcObserver): void {
  observer = obs
}
