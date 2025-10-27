/**
 * Patches @uniswap/universal-router-sdk to support Taiko chains
 *
 * The Universal Router SDK doesn't natively support Taiko networks, so we need to
 * override the UNIVERSAL_ROUTER_ADDRESS function to add support for:
 * - Taiko Mainnet (Chain ID: 167000)
 * - Taiko Hoodi Testnet (Chain ID: 167012)
 *
 * Note: Taiko uses SwapRouter02, not the Universal Router contract.
 * The SwapRouter02 is compatible with the Universal Router SDK interface.
 */

import { UNIVERSAL_ROUTER_ADDRESS as SDK_UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { TAIKO_MAINNET_CHAIN_ID, TAIKO_HOODI_CHAIN_ID, TAIKO_UNIVERSAL_ROUTER_ADDRESS } from '../constants/taiko'

// Store the original function
const originalUniversalRouterAddress = SDK_UNIVERSAL_ROUTER_ADDRESS

/**
 * Enhanced UNIVERSAL_ROUTER_ADDRESS that supports Taiko chains
 * Falls back to the original SDK implementation for other chains
 */
export function UNIVERSAL_ROUTER_ADDRESS(chainId: number): string {
  // Check if this is a Taiko chain
  if (chainId === TAIKO_MAINNET_CHAIN_ID || chainId === TAIKO_HOODI_CHAIN_ID) {
    const address = TAIKO_UNIVERSAL_ROUTER_ADDRESS[chainId]
    if (!address || address === '0x0000000000000000000000000000000000000000') {
      throw new Error(`Universal Router not deployed on Taiko chain ${chainId}`)
    }
    return address
  }

  // Fall back to the original SDK implementation for other chains
  const address = originalUniversalRouterAddress(chainId)
  return address
}

/**
 * Patches the global module to use our enhanced UNIVERSAL_ROUTER_ADDRESS
 * This must be called early in the app initialization before any routing code runs
 */
export function patchUniversalRouterForTaiko() {
  // We can't directly override the SDK's exported function, but we can ensure our
  // application code uses our patched version. The actual patching happens by
  // importing from this module instead of directly from the SDK.
}
