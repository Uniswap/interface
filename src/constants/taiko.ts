/**
 * Taiko Chain Configurations
 *
 * DEPRECATED: This file is deprecated. Please use the new modular chain configuration system.
 * Import from 'config/chains' instead of 'constants/taiko'.
 *
 * @deprecated Use config/chains instead
 * @see src/config/chains
 *
 * This file now re-exports from the new chain configuration system for backward compatibility.
 */

// Re-export from new config system for backward compatibility
export {
  TAIKO_MAINNET_CHAIN_ID,
  TAIKO_HOODI_CHAIN_ID,
  TAIKO_MAINNET_ADDRESSES,
  TAIKO_HOODI_ADDRESSES,
  TAIKO_UNIVERSAL_ROUTER_ADDRESS,
  getTaikoUniversalRouterAddress as getUniversalRouterAddress,
} from 'config/chains'

/**
 * Legacy SDK-compatible exports
 * @deprecated Use the registry exports from config/chains instead
 */
export {
  V3_CORE_FACTORY_ADDRESSES as TAIKO_V3_CORE_FACTORY_ADDRESSES,
  V3_MIGRATOR_ADDRESSES as TAIKO_V3_MIGRATOR_ADDRESSES,
  MULTICALL_ADDRESSES as TAIKO_MULTICALL_ADDRESSES,
  QUOTER_ADDRESSES as TAIKO_QUOTER_ADDRESSES,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES as TAIKO_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  TICK_LENS_ADDRESSES as TAIKO_TICK_LENS_ADDRESSES,
  SWAP_ROUTER_02_ADDRESSES as TAIKO_SWAP_ROUTER_02_ADDRESSES,
} from 'config/chains'

// Hoodi-specific legacy exports
import { TAIKO_HOODI_ADDRESSES, TAIKO_HOODI_CHAIN_ID } from 'config/chains'

export const TAIKO_HOODI_V3_CORE_FACTORY_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.factory,
} as const

export const TAIKO_HOODI_V3_MIGRATOR_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.v3Migrator,
} as const

export const TAIKO_HOODI_MULTICALL_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.multicall,
} as const

export const TAIKO_HOODI_QUOTER_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.quoterV2,
} as const

export const TAIKO_HOODI_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.positionManager,
} as const

export const TAIKO_HOODI_TICK_LENS_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.tickLens,
} as const

export const TAIKO_HOODI_SWAP_ROUTER_02_ADDRESSES = {
  [TAIKO_HOODI_CHAIN_ID]: TAIKO_HOODI_ADDRESSES.router,
} as const
