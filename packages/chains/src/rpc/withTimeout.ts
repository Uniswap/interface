/**
 * Race a promise against a timeout. Used to bound `getRequestHeaders` calls
 * before fetch — without this, a hung session/device-id resolver would hang
 * the entire RPC fetch indefinitely (the viem transport's `UNIRPC_TIMEOUT_MS`
 * only starts after fetch is invoked, and the ethers path has no transport
 * timeout at all).
 */
export async function withTimeout<T>(promise: Promise<T>, options: { timeoutMs: number; label: string }): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${options.label} timed out after ${options.timeoutMs}ms`)),
          options.timeoutMs,
        )
      }),
    ])
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * Bound for resolving session/device headers before an RPC fetch. Tighter
 * than the 6s transport timeout because header resolution is purely local
 * (storage reads + crypto) — anything slower is a hang, not network latency.
 */
export const HEADER_RESOLVE_TIMEOUT_MS = 2000
