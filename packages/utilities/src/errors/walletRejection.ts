// Dependency-free on purpose (unlike errors/index.ts, which re-exports from @universe/environment) so
// any app can classify wallet errors. walletRejection.test.ts fails if this file gains an import.

// You may throw an instance of this class when the user rejects a request in their wallet.
// The benefit is that you can distinguish this error from other errors using didUserReject().
export class UserRejectedRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserRejectedRequestError'
  }
}

/** Text segments from a structured error (Rainbow-style checks use each part separately so /request/ + /reject/ cannot match across fields). */
export function errorTextParts(error: unknown): string[] {
  if (typeof error === 'string') {
    return error ? [error] : []
  }
  if (!error || typeof error !== 'object') {
    return []
  }
  const { shortMessage, message, reason } = error as { shortMessage?: unknown; message?: unknown; reason?: unknown }
  return [shortMessage, message, reason].filter((s): s is string => typeof s === 'string' && s.length > 0)
}

function isWalletRejectionRpcCode(code: unknown): boolean {
  if (code === 4001 || code === 5750) {
    return true
  }
  if (code === 'ACTION_REJECTED') {
    return true
  }
  // Some providers stringify JSON-RPC codes; viem may surface bigint.
  if (typeof code === 'string' && (code === '4001' || Number(code) === 4001)) {
    return true
  }
  if (typeof code === 'bigint' && code === 4001n) {
    return true
  }
  return false
}

function didUserRejectOneLevel(error: unknown): boolean {
  if (
    isWalletRejectionRpcCode((error as { code?: unknown } | null | undefined)?.code) ||
    error instanceof UserRejectedRequestError
  ) {
    return true
  }
  const parts = errorTextParts(error)
  const reason = parts.join(' ')
  // A revert reason is the contract's own text ("Transfer declined by blacklist", "Bid rejected"), and viem's message
  // around it always says "Request Arguments:", so no wallet phrase below applies to a level that mentions a revert.
  if (/revert/i.test(reason)) {
    return false
  }
  const isRainbowStyleRejection = parts.some((part) => /request/i.test(part) && /reject/i.test(part))
  return (
    // For Rainbow (both patterns must appear in the same segment):
    isRainbowStyleRejection ||
    // For Frame ("User declined transaction") and Ledger Live ("Transaction declined"):
    /declined/i.test(reason) ||
    // For SafePal:
    /cancell?ed by user/i.test(reason) ||
    // For Trust:
    /user cancell?ed/i.test(reason) ||
    // For Coinbase:
    /user denied/i.test(reason) ||
    // For Fireblocks
    /user rejected/i.test(reason) ||
    // For Binance:
    /closed modal/i.test(reason) ||
    // For Solflare connection:
    /connection rejected/i.test(reason) ||
    // For Solflare transaction rejection:
    /transaction cancelled/i.test(reason)
  )
}

/** Walks `cause`, `originalError`, and legacy `error` / `data.originalError` chains (wallets + viem + our transaction wrappers). */
export function someInErrorChain(error: unknown, predicate: (error: unknown) => boolean): boolean {
  const visited = new WeakSet<object>()
  const queue: unknown[] = [error]
  while (queue.length > 0) {
    const current = queue.pop()
    if (!current) {
      continue
    }
    if (typeof current === 'object') {
      if (visited.has(current)) {
        continue
      }
      visited.add(current)
    }
    if (predicate(current)) {
      return true
    }
    if (typeof current === 'object') {
      const level = current as {
        cause?: unknown
        originalError?: unknown
        error?: unknown
        data?: unknown
        details?: unknown
      }
      if ('cause' in level && level.cause) {
        queue.push(level.cause)
      }
      if ('originalError' in level && level.originalError) {
        queue.push(level.originalError)
      }
      if ('error' in level && level.error) {
        queue.push(level.error)
      }
      if ('data' in level && level.data && typeof level.data === 'object' && 'originalError' in level.data) {
        queue.push(level.data.originalError)
      }
      if ('details' in level && Array.isArray(level.details)) {
        for (const detail of level.details) {
          queue.push(detail)
        }
      }
    }
  }
  return false
}

/** True when the user declined the request in their wallet (a choice, not a failure), at any level of the error chain. */
export function didUserReject(error: unknown): boolean {
  return someInErrorChain(error, didUserRejectOneLevel)
}
