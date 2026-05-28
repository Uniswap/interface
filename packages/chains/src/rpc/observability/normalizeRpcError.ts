/**
 * Normalize errors from ethers + viem RPC paths into a stable shape before
 * handing them to the observer. Without this, the rate-limited rpcObserver
 * (which buckets by `error.message`) blows past `MAX_KEYS_PER_BUCKET` for the
 * ethers `perform()` path: ethers wraps every fetch failure with
 * `'missing response (requestBody=\"...id:42...\", serverError={...}, ...)'`,
 * embedding the per-request `id` into the message and making each error a
 * unique bucket key.
 *
 * This normalizer extracts the underlying JSON-RPC error message (when the
 * server returned one) or ethers' short `reason` string (for transport-level
 * failures), so observers see a stable, low-cardinality message.
 *
 * Returns a fresh `Error` so callers don't mutate the original — the original
 * still propagates up the call stack untouched.
 */
export function normalizeRpcError(error: unknown): Error & { code?: number | string; data?: unknown } {
  if (!(error instanceof Error)) {
    return new Error(String(error))
  }

  const anyErr = error as Error & {
    code?: number | string
    data?: unknown
    reason?: string
    error?: { message?: unknown; code?: number | string; data?: unknown }
  }

  // ethers wraps server-returned JSON-RPC errors as { error: { message, code, data } }.
  // Prefer that nested message — it's the actual JSON-RPC error string and has
  // bounded cardinality.
  const inner = anyErr.error
  if (inner && typeof inner === 'object' && typeof inner.message === 'string') {
    const out = new Error(inner.message) as Error & { code?: number | string; data?: unknown }
    out.code = inner.code ?? anyErr.code
    out.data = inner.data
    out.stack = error.stack
    return out
  }

  // ethers transport-level errors set `reason` to a short label
  // (e.g. 'missing response') alongside a verbose `message`. Prefer the reason.
  if (typeof anyErr.reason === 'string' && anyErr.reason.length > 0 && anyErr.reason !== error.message) {
    const out = new Error(anyErr.reason) as Error & { code?: number | string; data?: unknown }
    out.code = anyErr.code
    out.stack = error.stack
    return out
  }

  return error as Error & { code?: number | string; data?: unknown }
}
