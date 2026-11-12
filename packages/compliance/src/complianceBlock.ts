import { Code, ConnectError } from '@connectrpc/connect'
import { ComplianceBlock } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'

/** The `message` the gateway puts on a wallet-level compliance 403 (trading's ACCOUNT_BLOCKED_ERROR wording). */
const COMPLIANCE_WALLET_BLOCKED_MESSAGE = 'Account is blocked'

/** The same wording, case-insensitive, for the message match below. */
const ACCOUNT_BLOCKED_PATTERN = /account is blocked/i

type LegacyErrorShape = { data?: { detail?: string }; name?: string }

function errorMessageText(error: unknown): string | undefined {
  if (error instanceof ConnectError) {
    return error.rawMessage
  }
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && ('data' in error || 'name' in error)) {
    const legacy = error as LegacyErrorShape
    return legacy.data?.detail ?? legacy.name
  }
  return undefined
}

/**
 * True when the Entry Gateway's compliance gate refused the request: a
 * PermissionDenied carrying a `ComplianceBlock` detail. The detail is the
 * contract; the wallet-block message is a fallback for an envelope whose
 * detail didn't decode.
 */
export function isComplianceBlockError(err: unknown): boolean {
  return (
    err instanceof ConnectError &&
    err.code === Code.PermissionDenied &&
    (err.findDetails(ComplianceBlock).length > 0 || err.rawMessage === COMPLIANCE_WALLET_BLOCKED_MESSAGE)
  )
}

/**
 * True when the compliance gate refused the request because the screened wallet
 * itself is blocked. A token-only block (`walletBlocked: false`) is a compliance
 * block but says nothing about the wallet, so it is not one of these.
 */
export function isComplianceWalletBlockError(err: unknown): boolean {
  if (!(err instanceof ConnectError) || err.code !== Code.PermissionDenied) {
    return false
  }
  const blocks = err.findDetails(ComplianceBlock)
  if (blocks.length > 0) {
    return blocks.some((block) => block.walletBlocked)
  }
  return err.rawMessage === COMPLIANCE_WALLET_BLOCKED_MESSAGE
}

/**
 * True when a backend refused the action because the wallet is sanctioned, in the
 * shapes that carry only the message: trading and the liquidity service answer over
 * ConnectRPC with `Code.Unauthenticated` and their `ACCOUNT_BLOCKED_ERROR` text, which
 * neither the gateway detail above nor the REST-shaped `isBlockedAccountFetchError`
 * sees.
 *
 * Matched on the message rather than the code: an expired session is `Unauthenticated`
 * too (see `isConnectUnauthorized` in `@universe/sessions`), and telling a logged-out
 * user their wallet is blocked would be worse than the generic error.
 */
export function isAccountBlockedError(error: unknown): boolean {
  const message = errorMessageText(error)
  return Boolean(message && ACCOUNT_BLOCKED_PATTERN.test(message))
}
