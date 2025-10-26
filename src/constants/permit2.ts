/**
 * Permit2 Contract Addresses
 *
 * Permit2 is typically deployed to the same canonical address across all chains,
 * but some chains (like Taiko testnets) may have different addresses.
 */

import { PERMIT2_ADDRESS as CANONICAL_PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { TAIKO_HOODI_CHAIN_ID } from 'config/chains'

/**
 * Custom Permit2 addresses for chains that don't use the canonical address
 */
const CUSTOM_PERMIT2_ADDRESSES: { [chainId: number]: string } = {
  [TAIKO_HOODI_CHAIN_ID]: '0x333a379c824BFfAC68F1235ed6ACe5251AE7ed2C', // Deployed Permit2 on Taiko Hoodi
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
 * Canonical Permit2 address (used on most chains)
 * @deprecated Use getPermit2Address(chainId) instead for chain-specific addresses
 */
export const PERMIT2_ADDRESS = CANONICAL_PERMIT2_ADDRESS
