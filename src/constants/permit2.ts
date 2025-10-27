/**
 * Permit2 SDK Patch
 *
 * This module re-exports everything from @uniswap/permit2-sdk but provides
 * chain-specific PERMIT2_ADDRESS overrides for chains that deployed Permit2
 * to non-canonical addresses.
 *
 * IMPORTANT: All imports of @uniswap/permit2-sdk in this codebase should
 * import from 'constants/permit2' instead to ensure correct addresses.
 */

// Re-export everything from the SDK
export * from '@uniswap/permit2-sdk'

import { PERMIT2_ADDRESS as CANONICAL_PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { TAIKO_HOODI_CHAIN_ID } from 'config/chains'

/**
 * Custom Permit2 addresses for chains that don't use the canonical address
 */
const CUSTOM_PERMIT2_ADDRESSES: { [chainId: number]: string } = {
  [TAIKO_HOODI_CHAIN_ID]: '0xC723E421FE936ad9BcB5d89EF710771BA9C44C7D', // Deployed Permit2 on Taiko Hoodi (Solidity 0.8.17, Shanghai EVM)
}

/**
 * Get the Permit2 address for a given chain
 * @param chainId - The chain ID
 * @returns The Permit2 address for the chain
 */
export function getPermit2Address(chainId?: number): string {
  if (chainId && chainId in CUSTOM_PERMIT2_ADDRESSES) {
    return CUSTOM_PERMIT2_ADDRESSES[chainId]
  }
  return CANONICAL_PERMIT2_ADDRESS
}

/**
 * PERMIT2_ADDRESS override
 *
 * NOTE: This exports the canonical address for backward compatibility.
 * Code that needs chain-specific addresses should use getPermit2Address(chainId).
 *
 * For Taiko Hoodi, use getPermit2Address(TAIKO_HOODI_CHAIN_ID) to get the correct address.
 */
export const PERMIT2_ADDRESS = CANONICAL_PERMIT2_ADDRESS
