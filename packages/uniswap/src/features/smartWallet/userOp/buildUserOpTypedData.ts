import type { TypedDataDomain } from 'viem'
import {
  entryPoint08Address,
  formatUserOperation,
  getUserOperationTypedData,
  type RpcUserOperation,
} from 'viem/account-abstraction'

export interface PackedUserOpTypedData {
  domain: TypedDataDomain
  /** The `PackedUserOperation` struct field definitions, in canonical order. */
  packedUserOperationFields: { name: string; type: string }[]
  message: Record<string, unknown>
}

/**
 * Build the EIP-712 typed data for an ERC-4337 v0.8 PackedUserOperation via
 * viem. Shared by the wallet-package native UserOp signer and the web
 * embedded-wallet passkey UserOp signer; each wraps this with its own signing
 * transport (native ethers signer vs. Privy `eth_signTypedData_v4`).
 *
 * NOTE: `formatUserOperation` drops `eip7702Auth` — callers that need it must
 * preserve it from the original `rpcUserOp`.
 */
export function buildPackedUserOpTypedData(rpcUserOp: RpcUserOperation<'0.8'>, chainId: number): PackedUserOpTypedData {
  // Convert hex RPC form → bigint native form for viem's typed-data utilities.
  const nativeUserOp = { ...formatUserOperation(rpcUserOp) }
  const typedData = getUserOperationTypedData({
    chainId,
    entryPointAddress: entryPoint08Address,
    userOperation: nativeUserOp,
  })
  if (!typedData.domain) {
    throw new Error('Typed data domain is required for UserOp signing')
  }
  return {
    domain: typedData.domain,
    packedUserOperationFields: typedData.types.PackedUserOperation.map((field) => ({
      name: field.name,
      type: field.type,
    })),
    message: typedData.message as Record<string, unknown>,
  }
}
