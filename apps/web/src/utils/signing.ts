import type { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { _TypedDataEncoder } from '@ethersproject/hash'
import type { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers'
import { logger } from 'utilities/src/logger/logger'
import { getWalletMeta, WalletType } from '~/utils/walletMeta'

// These are WalletConnect peers which do not implement eth_signTypedData_v4, but *do* implement eth_signTypedData.
// They are special-cased so that signing will still use EIP-712 (which is safer for the user).
const WC_PEERS_LACKING_V4_SUPPORT = ['SafePal Wallet', 'Ledger Wallet Connect']

// Type definitions for the two possible permit type formats
type TypeField = { name: string; type: string }
type TypeFieldArrayLike = { fields: TypeField[] }

// TradingApi format uses arrays directly, Liquidity API uses TypeFieldArray with a fields property
type TradingApiTypes = Record<string, TypedDataField[]>
type LiquidityApiTypes = Record<string, TypeFieldArrayLike>
type PermitTypes = TradingApiTypes | LiquidityApiTypes

// Assumes v4 support by default, except for known wallets.
function supportsV4(provider: JsonRpcProvider): boolean {
  const meta = getWalletMeta(provider)
  if (meta) {
    const { type, name } = meta
    if (name) {
      if (type === WalletType.WALLET_CONNECT && name && WC_PEERS_LACKING_V4_SUPPORT.includes(name)) {
        return false
      }
    }
  }

  return true
}

/**
 * Type guard to check if a value is a TypeFieldArrayLike (Liquidity API format).
 */
function isTypeFieldArrayLike(value: TypedDataField[] | TypeFieldArrayLike): value is TypeFieldArrayLike {
  return 'fields' in value && Array.isArray(value.fields)
}

/**
 * Normalizes types from either TradingApi format (Record<string, TypedDataField[]>) or
 * Liquidity API format (Record<string, TypeFieldArrayLike>) to the format expected by ethers.js.
 */
function normalizeTypedDataTypes(types: PermitTypes): Record<string, TypedDataField[]> {
  const normalized: Record<string, TypedDataField[]> = {}

  for (const [key, value] of Object.entries(types)) {
    if (isTypeFieldArrayLike(value)) {
      // Liquidity API format: Convert TypeFieldArrayLike to array of TypedDataField
      normalized[key] = value.fields.map((field) => ({
        name: field.name,
        type: field.type,
      }))
    } else {
      // TradingApi format: Already an array of TypedDataField
      normalized[key] = value
    }
  }

  return normalized
}

/**
 * Signs TypedData with EIP-712, if available, or else by falling back to eth_sign.
 * Calls eth_signTypedData_v4, or eth_signTypedData for wallets with incomplete EIP-712 support.
 *
 * @see https://github.com/ethers-io/ethers.js/blob/c80fcddf50a9023486e9f9acb1848aba4c19f7b6/packages/providers/src.ts/json-rpc-provider.ts#L334
 */
export async function signTypedData({
  signer,
  domain,
  types,
  value,
}: {
  signer: JsonRpcSigner
  domain: TypedDataDomain
  types: PermitTypes // Accept both TradingApi and Liquidity API formats
  // Use Record<string, any> for the value to match the JsonRpcSigner._signTypedData signature.
  value: Record<string, any>
}) {
  // Normalize types to handle both TradingApi and Liquidity API formats
  const normalizedTypes = normalizeTypedDataTypes(types)
  // Populate any ENS names (in-place)
  const populated = await _TypedDataEncoder.resolveNames(domain, normalizedTypes, value, (name: string) => {
    return signer.provider.resolveName(name) as Promise<string>
  })

  const method = supportsV4(signer.provider) ? 'eth_signTypedData_v4' : 'eth_signTypedData'
  const address = (await signer.getAddress()).toLowerCase()
  const message = JSON.stringify(_TypedDataEncoder.getPayload(populated.domain, normalizedTypes, populated.value))

  try {
    return await signer.provider.send(method, [address, message])
  } catch (error) {
    // If eth_signTypedData is unimplemented, fall back to eth_sign.
    if (
      typeof error.message === 'string' &&
      (error.message.match(/not (found|implemented)/i) ||
        error.message.match(/TrustWalletConnect.WCError error 1/) ||
        error.message.match(/Missing or invalid/))
    ) {
      logger.warn(
        'signing',
        'signTypedData',
        'signTypedData: wallet does not implement EIP-712, falling back to eth_sign',
        error,
      )
      const hash = _TypedDataEncoder.hash(populated.domain, normalizedTypes, populated.value)
      return await signer.provider.send('eth_sign', [address, hash])
    }
    throw error
  }
}
