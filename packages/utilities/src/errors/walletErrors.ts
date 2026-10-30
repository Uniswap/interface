// Dependency-free on purpose, like walletRejection.ts: any app can classify wallet errors without
// pulling in viem or wagmi. walletErrors.test.ts fails if this file gains an import.
// Matching is by `name` and `code` rather than `instanceof`, so a duplicated viem or wagmi in the
// dependency graph cannot silently break a match.

/** One level of a wagmi/viem error's `cause` chain (see {@link matchesCauseChain}). */
export interface ErrorLevel {
  code?: unknown
  name?: unknown
  message?: unknown
  cause?: unknown
}

/**
 * True when any level of the error's `cause` chain matches — wagmi/viem nest the meaningful error
 * inside a TransactionExecutionError. Follows `cause` only (unlike walletRejection's
 * someInErrorChain), and is depth-capped so a cyclic chain can't spin.
 */
export function matchesCauseChain(error: unknown, matches: (level: ErrorLevel) => boolean): boolean {
  let current: unknown = error
  for (let depth = 0; depth < 10 && typeof current === 'object' && current !== null; depth += 1) {
    const candidate = current as ErrorLevel
    if (matches(candidate)) {
      return true
    }
    current = candidate.cause
  }
  return false
}

/** wagmi/viem error names for "the provider can no longer sign". */
const DISCONNECT_NAMES = new Set([
  'ConnectorNotConnectedError',
  'ConnectorAccountNotFoundError',
  'ProviderDisconnectedError',
  'ChainDisconnectedError',
  'AccountNotFoundError',
])
const DISCONNECT_MESSAGE =
  /connector not connected|not found for connector|provider is disconnected|provider is not connected|could not find an account/i

/** wagmi/viem error names for "the wallet is on the wrong chain". */
const CHAIN_MISMATCH_NAMES = new Set([
  'ChainMismatchError',
  'ChainNotConfiguredError',
  'SwitchChainNotSupportedError',
  'SwitchChainError',
  'UnsupportedChainIdError',
])
const CHAIN_MISMATCH_MESSAGE =
  /does not match the target chain|chain mismatch|chain not configured|unrecognized chain id|switch chain (?:not supported|error)/i

/**
 * True when the connector dropped mid-flow (wagmi ConnectorNotConnectedError /
 * ConnectorAccountNotFoundError, viem ProviderDisconnectedError, EIP-1193 4900/4901) — nothing was
 * signed, so the fix is reconnecting, not retrying into the same dead provider.
 */
export function isConnectorDisconnectedError(error: unknown): boolean {
  return matchesCauseChain(
    error,
    (level) =>
      level.code === 4900 ||
      level.code === 4901 ||
      (typeof level.name === 'string' && DISCONNECT_NAMES.has(level.name)) ||
      (typeof level.message === 'string' && DISCONNECT_MESSAGE.test(level.message)),
  )
}

/**
 * True when the wallet is on (or was moved to) a chain the transaction isn't for — viem
 * ChainMismatchError, wagmi's switch-chain failures, EIP-1193 4902. Check AFTER `didUserReject`: a
 * DECLINED switch prompt is a user choice, not a chain problem.
 */
export function isChainMismatchError(error: unknown): boolean {
  return matchesCauseChain(
    error,
    (level) =>
      level.code === 4902 ||
      (typeof level.name === 'string' && CHAIN_MISMATCH_NAMES.has(level.name)) ||
      (typeof level.message === 'string' && CHAIN_MISMATCH_MESSAGE.test(level.message)),
  )
}

/**
 * Failures that PROVE nothing was broadcast. Mostly viem node errors, i.e. the wallet/node
 * semantically REFUSED the transaction: reaching one of those means `eth_sendTransaction` came back
 * with a message viem could classify, which only happens when the node evaluated the request and
 * rejected it — nothing entered the mempool. The rest are earlier still: raised before the RPC call
 * is made at all (cited individually below).
 *
 * Deliberately excludes viem's `UnknownNodeError` (the catch-all when no message matched) and every
 * transport-level failure: those are exactly the "may have broadcast, transport died" case and must
 * stay ambiguous.
 *
 * Derived from viem 2.49's `getNodeError` mapping (`errors/node.js`), which sets each class's `name`.
 * This package depends on neither viem nor wagmi, so the versions cited here are re-checked by
 * apps/pools-xyz's `walletErrorNames.test.ts`, which fails when an upgrade drops or renames a name.
 */
const PRE_BROADCAST_ERROR_NAMES = new Set([
  'InsufficientFundsError',
  'IntrinsicGasTooLowError',
  'IntrinsicGasTooHighError',
  'FeeCapTooLowError',
  'FeeCapTooHighError',
  'TipAboveFeeCapError',
  'NonceTooLowError',
  'NonceTooHighError',
  'NonceMaxValueError',
  'TransactionTypeNotSupportedError',
  // The wallet's own pre-flight simulation refused it; it never went out.
  'ExecutionRevertedError',
  // Not from getNodeError — these are raised BEFORE the RPC call, verified against the installed
  // versions rather than assumed. All are refusals the user can act on (reconnect, switch network),
  // so a caller must not file them with the "may have broadcast" failures, which are never retryable.
  //
  // @wagmi/core 3.5.1 `errors/config.js` — thrown at `actions/getConnectorClient.js:32` when no
  // connection resolves, before any client exists to make a request with.
  'ConnectorNotConnectedError',
  // The other two `getConnectorClient` refusals, from the same file and the same pre-client window —
  // verified in @wagmi/core 3.5.1 `errors/config.js` (both set their own `name`), thrown at
  // `actions/getConnectorClient.js:51` and `:37`. A mid-flight account switch or a connector on the
  // wrong chain lands here.
  'ConnectorAccountNotFoundError',
  'ConnectorChainMismatchError',
  // viem 2.49.0 `errors/chain.js` — thrown by `assertCurrentChain` at
  // `actions/wallet/sendTransaction.js:96`, before the request is even formatted and well before the
  // `eth_sendTransaction` at :125-130.
  'ChainMismatchError',
])

/**
 * True when the failure PROVES the transaction was never broadcast, so a retry is safe. viem wraps a
 * refused `eth_sendTransaction` in a TransactionExecutionError whose `cause` is one of the
 * classified node errors above; a lost transport produces neither.
 */
export function isPreBroadcastError(error: unknown): boolean {
  return matchesCauseChain(
    error,
    (level) => typeof level.name === 'string' && PRE_BROADCAST_ERROR_NAMES.has(level.name),
  )
}
