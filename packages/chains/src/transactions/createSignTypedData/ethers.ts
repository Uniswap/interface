import type { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import type { JsonRpcSigner } from '@ethersproject/providers'
import { type PermitTypes, normalizeTypes, shouldFallbackToEthSign } from './shared'

// Public name for ethers callers — the underlying shape is the shared
// structural `PermitTypes`, which ethers `TypedDataField` values satisfy
// directly (they are exactly `{ name: string; type: string }`).
export type EthersPermitTypes = PermitTypes

export type EthersSignTypedDataParams = {
  signer: JsonRpcSigner
  domain: TypedDataDomain
  types: EthersPermitTypes
  // Keeping from the original implementation
  // oxlint-disable-next-line typescript/no-explicit-any
  value: Record<string, any>
  // Caller decides between v4 and v3 based on its own wallet
  // detection. Defaults to `eth_signTypedData_v4` when unspecified.
  method?: 'eth_signTypedData_v4' | 'eth_signTypedData'
  // Invoked once before degrading to `eth_sign`
  // so consumers can log or emit telemetry.
  onFallback?: (error: unknown) => void
}

type PreparedEthersSignTypedData = {
  address: string
  message: string
  populatedDomain: TypedDataDomain
  normalizedTypes: Record<string, TypedDataField[]>
  populatedValue: Record<string, unknown>
}

/**
 * Builds the EIP-712 JSON payload via `_TypedDataEncoder` so the
 * caller can ship it to either `eth_signTypedData_v4` or fall back
 * to `eth_sign` with the corresponding hash. Pulls the address
 * from the signer and uses its provider for ENS resolution.
 */
export async function prepareEthersSignTypedData({
  signer,
  domain,
  types,
  value,
}: {
  signer: JsonRpcSigner
  domain: TypedDataDomain
  types: EthersPermitTypes
  // Keeping from the original implementation
  // oxlint-disable-next-line typescript/no-explicit-any
  value: Record<string, any>
}): Promise<PreparedEthersSignTypedData> {
  const normalizedTypes = normalizeTypes(types)
  const populated = await _TypedDataEncoder.resolveNames(domain, normalizedTypes, value, (name: string) => {
    return signer.provider.resolveName(name) as Promise<string>
  })
  const address = (await signer.getAddress()).toLowerCase()
  const message = JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, normalizedTypes, populated.value))
  return {
    address,
    message,
    populatedDomain: populated.domain,
    normalizedTypes,
    populatedValue: populated.value,
  }
}

/**
 * Sends the prepared payload via the signer's RPC. On a known
 * "wallet doesn't implement EIP-712" error, calls `onFallback` (if any),
 * computes the EIP-712 hash, and dispatches `eth_sign` against it.
 */
export async function sendEthersSignTypedData({
  signer,
  prepared,
  method,
  onFallback,
}: {
  signer: JsonRpcSigner
  prepared: PreparedEthersSignTypedData
  method: 'eth_signTypedData_v4' | 'eth_signTypedData'
  onFallback?: (error: unknown) => void
}): Promise<string> {
  try {
    // oxlint-disable-next-line typescript/no-unsafe-return -- biome-parity: oxlint is stricter here
    return await signer.provider.send(method, [prepared.address, prepared.message])
  } catch (error) {
    if (shouldFallbackToEthSign(error)) {
      onFallback?.(error)
      const hash = _TypedDataEncoder.hash(prepared.populatedDomain, prepared.normalizedTypes, prepared.populatedValue)
      // oxlint-disable-next-line typescript/no-unsafe-return -- biome-parity: oxlint is stricter here
      return await signer.provider.send('eth_sign', [prepared.address, hash])
    }
    throw error
  }
}
