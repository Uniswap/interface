/**
 * Chain Configuration System
 *
 * Production-ready, modular chain configuration for Taiko-only Uniswap interface.
 *
 * This module provides:
 * - Validated chain configurations (no zero addresses)
 * - Centralized registry with enable/disable support
 * - Type-safe exports for all contract addresses
 * - Easy integration with existing codebase
 *
 * @example
 * ```typescript
 * import { getEnabledChainIds, getChainAddresses } from 'config/chains'
 *
 * // Get all enabled chain IDs
 * const chainIds = getEnabledChainIds()
 *
 * // Get addresses for a specific chain
 * const addresses = getChainAddresses(167012)
 * ```
 *
 * @module config/chains
 */

// Re-export everything from the registry as the main interface
export type { ChainConfig } from './registry'
export {
  getAllChains,
  getEnabledChains,
  getDisabledChains,
  getChainConfig,
  isChainEnabled,
  getChainAddresses,
  getChainMetadata,
  getEnabledChainIds,
  validateRegistry,
  ENABLED_CHAIN_ADDRESSES,
  ENABLED_CHAIN_METADATA,
  V3_CORE_FACTORY_ADDRESSES,
  V3_MIGRATOR_ADDRESSES,
  MULTICALL_ADDRESSES,
  QUOTER_ADDRESSES,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  TICK_LENS_ADDRESSES,
  SWAP_ROUTER_02_ADDRESSES,
  WETH9_ADDRESSES,
} from './registry'

// Re-export Taiko chain constants and utilities
export type { TaikoChainMetadata } from './taiko'
export {
  TAIKO_MAINNET_CHAIN_ID,
  TAIKO_HOODI_CHAIN_ID,
  TAIKO_HOODI_ADDRESSES,
  TAIKO_MAINNET_ADDRESSES,
  TAIKO_HOODI_METADATA,
  TAIKO_MAINNET_METADATA,
  TAIKO_UNIVERSAL_ROUTER_ADDRESS,
  getTaikoUniversalRouterAddress,
  isTaikoChain,
  isTaikoHoodi,
  isTaikoMainnet,
} from './taiko'

// Re-export validation utilities (useful for testing and debugging)
export type { ChainAddresses, ValidationResult } from './validation'
export {
  validateChainAddresses,
  validateChainAddressesOrThrow,
  validateMultipleChains,
  allChainsValid,
  getValidationSummary,
  isValidAddress,
  validateAddress,
  REQUIRED_CONTRACTS,
  OPTIONAL_CONTRACTS,
} from './validation'
