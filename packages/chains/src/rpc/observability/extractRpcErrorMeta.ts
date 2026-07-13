/**
 * Pull structured failure metadata out of the heterogeneous error shapes the
 * three RPC transports throw, so the observer can log queryable fields instead
 * of burying everything in a free-text message.
 *
 * Why this exists: the HTTP status and JSON-RPC error code are known at the
 * point of failure on every path, but today they only survive as substrings of
 * the error message — in four mutually-incompatible formats — or are dropped
 * outright by `normalizeRpcError`. Datadog can't facet a substring, so
 * operationally critical questions ("is this a 401 bot-block or a 5xx outage?",
 * "what JSON-RPC code is the gateway returning?") are unanswerable. This
 * recovers both as numbers.
 *
 * Shapes handled (provenance: this directory + node_modules/@ethersproject/web
 * + node_modules/viem/errors):
 *  - viem HttpRequestError:     `status` (number); message "...Status: 401..."
 *  - viem RpcError:             `code` (number), often nested under `cause`
 *  - ethers "bad response":     `status` (number), `code` = 'SERVER_ERROR'
 *  - ethers JSON-RPC envelope:  `code` = 'SERVER_ERROR', `error.code` (number, e.g. -32000)
 *  - ethers "missing response": no `status`; `code` = 'SERVER_ERROR', `serverError` set
 *  - ethers "timeout":          `code` = 'TIMEOUT'
 *  - Web3Provider fetch-func:   `status` (we attach it); message "RPC request failed: 403"
 *
 * Always best-effort: callers spread the result into the observer context, so a
 * field that can't be recovered is simply absent (and that absence is itself a
 * signal — e.g. no `httpStatus` means the server never responded).
 */
export interface RpcErrorMeta {
  /**
   * HTTP status the server returned (viem/ethers). Absent for network-level
   * failures where no response was received (the "missing response" class).
   */
  httpStatus?: number
  /** Numeric JSON-RPC error code (e.g. -32000), when the server returned a JSON-RPC error envelope. */
  rpcErrorCode?: number
  /** Coarse transport-level category — ethers' string `code` (SERVER_ERROR, TIMEOUT, NETWORK_ERROR, …). */
  errorCategory?: string
}

// ethers stringifies status as "status=401"; viem as "Status: 401"; the
// Web3Provider fetch-func as "RPC request failed: 403". Recover from the
// message only when no structured field is present.
const STATUS_FROM_MESSAGE_PATTERNS = [/\bstatus[=:]\s*(\d{3})\b/i, /RPC request failed:\s*(\d{3})\b/i]

function coerceHttpStatus(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isInteger(n) && n >= 100 && n <= 599 ? n : undefined
}

/**
 * Breadth-first walk over an error and its nested causes. Errors from these
 * libraries nest the real failure under `cause` (viem), `serverError` (ethers
 * transport failures), or `error` (ethers JSON-RPC envelope), so we visit all
 * three. Bounded node count + a seen-set guard against cyclic `cause` chains.
 */
function* walkErrorChain(root: unknown, maxNodes = 8): Generator<Record<string, unknown>> {
  const queue: unknown[] = [root]
  const seen = new Set<unknown>()
  let visited = 0
  while (queue.length > 0 && visited < maxNodes) {
    const current = queue.shift()
    if (!current || typeof current !== 'object' || seen.has(current)) {
      continue
    }
    seen.add(current)
    visited++
    yield current as Record<string, unknown>
    const node = current as { cause?: unknown; serverError?: unknown; error?: unknown }
    queue.push(node.cause, node.serverError, node.error)
  }
}

export function extractRpcErrorMeta(error: unknown): RpcErrorMeta {
  const meta: RpcErrorMeta = {}

  for (const node of walkErrorChain(error)) {
    const status = node['status']
    const code = node['code']

    // HTTP status: viem HttpRequestError and ethers "bad response" both set `status`.
    if (meta.httpStatus === undefined) {
      const parsed = coerceHttpStatus(status)
      if (parsed !== undefined) {
        meta.httpStatus = parsed
      }
    }
    // JSON-RPC code is numeric. ethers' string codes ('SERVER_ERROR', 'TIMEOUT')
    // are transport categories, not JSON-RPC codes — they land in errorCategory.
    if (meta.rpcErrorCode === undefined && typeof code === 'number') {
      meta.rpcErrorCode = code
    }
    if (meta.errorCategory === undefined && typeof code === 'string' && code.length > 0) {
      meta.errorCategory = code
    }
  }

  // Fallback: recover status from the message for paths that only stringify it
  // (older ethers verbose messages, viem's message, the Web3Provider fetch-func).
  if (meta.httpStatus === undefined) {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
    for (const pattern of STATUS_FROM_MESSAGE_PATTERNS) {
      const status = coerceHttpStatus(pattern.exec(message)?.[1])
      if (status !== undefined) {
        meta.httpStatus = status
        break
      }
    }
  }

  return meta
}
