/**
 * HookSwap Terminal — Launchpad contract addresses.
 *
 * HookOSV3Launcher (proxy) — direct-to-v3 fair launch: mints token + seeds
 * single-sided pool + registers the position in the fee vault.
 *
 * HookOSV3FeeVault (proxy) — holds each launch's LP position NFT forever
 * (principal locked), splits LP fees per-dex creator share, carves buyback slice.
 */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Address } from '~/chains'

/** Per-chain deployed `HookOSV3Launcher` proxy addresses. */
export const LAUNCHPAD_ADDRESSES: Partial<Record<UniverseChainId, Address>> = {
  [UniverseChainId.Robinhood]: '0x9B8d992704ddf38729535A641502bcc55734e0B8',
}

/** Per-chain deployed `HookOSV3FeeVault` proxy addresses. */
export const FEEVAULT_ADDRESSES: Partial<Record<UniverseChainId, Address>> = {
  [UniverseChainId.Robinhood]: '0x2974cE6341067398A5C1E6c0C14F99ED1C3122EF',
}

/** Deployed `HookOSV3Launcher` address for a chain, or `undefined` when not deployed. */
export function getLaunchpadAddress(chainId?: number): Address | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return LAUNCHPAD_ADDRESSES[chainId as UniverseChainId]
}

/** Deployed `HookOSV3FeeVault` address for a chain, or `undefined` when not deployed. */
export function getFeeVaultAddress(chainId?: number): Address | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return FEEVAULT_ADDRESSES[chainId as UniverseChainId]
}
