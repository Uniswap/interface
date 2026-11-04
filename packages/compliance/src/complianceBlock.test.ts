import { Code, ConnectError } from '@connectrpc/connect'
import { errorFromJson } from '@connectrpc/connect/protocol-connect'
import { isComplianceBlockError, isComplianceWalletBlockError } from '@universe/compliance/src/complianceBlock'
import { describe, expect, it } from 'vitest'

/**
 * The Entry Gateway compliance gate's Connect 403 as it arrives on the wire,
 * parsed the way the transport parses it. Literals are deliberately not derived
 * from the generated `ComplianceBlock`: `CAE` is `wallet_blocked: true` in
 * unpadded base64, which is how the gateway encodes the detail value; an empty
 * value is a block with `wallet_blocked: false` (a token-only refusal).
 */
function gatewayComplianceBlock(message = 'Account is blocked', value = 'CAE'): ConnectError {
  return errorFromJson(
    {
      code: 'permission_denied',
      message,
      details: [{ type: 'uniswap.compliancev2service.v1.ComplianceBlock', value, debug: { walletBlocked: true } }],
    },
    undefined,
    new ConnectError('HTTP 403', Code.PermissionDenied),
  )
}

describe(isComplianceBlockError, () => {
  it('matches the gateway compliance 403 carrying a ComplianceBlock detail', () => {
    const error = gatewayComplianceBlock()
    expect(error.details).toHaveLength(1)
    expect(isComplianceBlockError(error)).toBe(true)
  })

  it('matches on the detail whatever the message says', () => {
    expect(isComplianceBlockError(gatewayComplianceBlock('HTTP 403'))).toBe(true)
    expect(isComplianceBlockError(gatewayComplianceBlock('Token is blocked', ''))).toBe(true)
  })

  it("falls back to the gateway's wallet-block message when no detail decoded", () => {
    expect(isComplianceBlockError(new ConnectError('Account is blocked', Code.PermissionDenied))).toBe(true)
  })

  it('rejects a PermissionDenied with neither the detail nor the message (e.g. no session yet)', () => {
    expect(isComplianceBlockError(new ConnectError('forbidden', Code.PermissionDenied))).toBe(false)
    expect(isComplianceBlockError(new ConnectError('HTTP 403', Code.PermissionDenied))).toBe(false)
  })

  it('rejects other codes and non-Connect values', () => {
    expect(isComplianceBlockError(new ConnectError('Account is blocked', Code.Unauthenticated))).toBe(false)
    expect(isComplianceBlockError(new Error('Account is blocked'))).toBe(false)
    expect(isComplianceBlockError(null)).toBe(false)
  })
})

describe(isComplianceWalletBlockError, () => {
  it('matches a ComplianceBlock detail whose wallet is blocked, whatever the message', () => {
    expect(isComplianceWalletBlockError(gatewayComplianceBlock())).toBe(true)
    expect(isComplianceWalletBlockError(gatewayComplianceBlock('HTTP 403'))).toBe(true)
  })

  it('rejects a token-only ComplianceBlock — it carries no verdict on the wallet', () => {
    expect(isComplianceWalletBlockError(gatewayComplianceBlock('Token is blocked', ''))).toBe(false)
  })

  it('trusts a decoded detail over the message', () => {
    expect(isComplianceWalletBlockError(gatewayComplianceBlock('Account is blocked', ''))).toBe(false)
  })

  it("falls back to the gateway's wallet-block message when no detail decoded", () => {
    expect(isComplianceWalletBlockError(new ConnectError('Account is blocked', Code.PermissionDenied))).toBe(true)
    expect(isComplianceWalletBlockError(new ConnectError('Token is blocked', Code.PermissionDenied))).toBe(false)
  })

  it('rejects other PermissionDenied errors, other codes, and non-Connect values', () => {
    expect(isComplianceWalletBlockError(new ConnectError('HTTP 403', Code.PermissionDenied))).toBe(false)
    expect(isComplianceWalletBlockError(new ConnectError('Account is blocked', Code.Unauthenticated))).toBe(false)
    expect(isComplianceWalletBlockError(new Error('Account is blocked'))).toBe(false)
    expect(isComplianceWalletBlockError(null)).toBe(false)
  })
})
