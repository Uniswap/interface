import { ChainCapabilities, GetCapabilitiesResult } from 'state/walletCapabilities/lib/types'
import { ensure0xHex, type HexString, isValidHexString, numberToHex } from 'utilities/src/addresses/hex'

/**
 * Validates and normalizes wallet getCapabilities data structure
 * Ensures all chain IDs are properly formatted hex strings and all capabilities follow the expected structure
 *
 * @param data - Raw capabilities data from the wallet
 * @returns Normalized capability result or null if validation fails
 */
export function ensureValidatedCapabilities(data: unknown): GetCapabilitiesResult | null {
  // Type guard for the input data
  if (!isValidCapabilitiesObject(data)) {
    return null
  }

  const result: GetCapabilitiesResult = {}

  for (const [rawChainId, capabilities] of Object.entries(data)) {
    // Skip invalid capability entries early
    if (!isValidCapabilitiesEntry(capabilities)) {
      return null
    }

    // Normalize chain ID to hex format
    const normalizedChainId = normalizeChainId(rawChainId)
    if (!normalizedChainId) {
      return null // Invalid chain ID format
    }

    // Store validated entry
    result[normalizedChainId] = capabilities
  }

  return result
}

/**
 * Type guard to check if input is a valid non-null object
 */
export function isValidCapabilitiesObject(data: unknown): data is Record<string, unknown> {
  return Boolean(data) && typeof data === 'object' && !Array.isArray(data)
}

/**
 * Type guard to verify a capabilities entry structure
 */
export function isValidCapabilitiesEntry(entry: unknown): entry is ChainCapabilities {
  // Check if entry is a non-null, non-array object
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return false
  }

  // In EIP-5792, individual capabilities can have various structures
  // We only need to validate that the entry itself is an object
  // The specific structure of each capability should be validated separately
  return true
}

/**
 * Normalizes chain ID to hex format
 */
function normalizeChainId(chainId: string): HexString | null {
  // Already a valid hex string
  if (isValidHexString(chainId)) {
    return chainId
  }

  // Try to parse as number
  const chainIdNumber = Number(chainId)
  if (isNaN(chainIdNumber)) {
    return null
  }

  return ensure0xHex(numberToHex(chainIdNumber))
}
