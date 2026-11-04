import { Code, ConnectError } from '@connectrpc/connect'
import { ComplianceBlock } from '@uniswap/client-compliancev2/dist/uniswap/compliance/v1/api_pb'

/** The `message` the gateway puts on a wallet-level compliance 403 (trading's ACCOUNT_BLOCKED_ERROR wording). */
const COMPLIANCE_WALLET_BLOCKED_MESSAGE = 'Account is blocked'

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
