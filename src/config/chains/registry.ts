/**
 * Chain Registry System
 *
 * This module provides a centralized, validated registry of supported chains.
 * Chains are automatically validated on import to prevent zero addresses and
 * invalid configurations from being used in production.
 *
 * @module config/chains/registry
 */

import {
  TAIKO_HOODI_ADDRESSES,
  TAIKO_HOODI_CHAIN_ID,
  TAIKO_HOODI_METADATA,
  TAIKO_MAINNET_ADDRESSES,
  TAIKO_MAINNET_CHAIN_ID,
  TAIKO_MAINNET_METADATA,
  TaikoChainMetadata,
} from './taiko'
import { ChainAddresses, validateChainAddressesOrThrow, validateMultipleChains, getValidationSummary } from './validation'

/**
 * Complete chain configuration including addresses and metadata
 */
export interface ChainConfig {
  chainId: number
  addresses: ChainAddresses
  metadata: TaikoChainMetadata
  enabled: boolean
  isDefault?: boolean
}

/**
 * Environment variable to control which Taiko chains are enabled
 * Set REACT_APP_TAIKO_CHAIN to:
 * - 'mainnet' to enable only Taiko Mainnet
 * - 'hoodi' to enable only Taiko Hoodi testnet
 * - undefined/empty to enable all chains (default)
 */
const TAIKO_CHAIN_FILTER = process.env.REACT_APP_TAIKO_CHAIN?.toLowerCase()

/**
 * Check if a chain should be enabled based on environment variable
 */
function shouldEnableChain(chainId: number): boolean {
  if (!TAIKO_CHAIN_FILTER) {
    // No filter set - enable all chains
    return true
  }

  if (TAIKO_CHAIN_FILTER === 'mainnet' && chainId === TAIKO_MAINNET_CHAIN_ID) {
    return true
  }

  if (TAIKO_CHAIN_FILTER === 'hoodi' && chainId === TAIKO_HOODI_CHAIN_ID) {
    return true
  }

  return false
}

/**
 * Registry of all known Taiko chains (both enabled and disabled)
 * This is the single source of truth for chain configurations
 */
const ALL_CHAINS: ChainConfig[] = [
  // Taiko Mainnet - ENABLED (all verified contracts deployed)
  {
    chainId: TAIKO_MAINNET_CHAIN_ID,
    addresses: TAIKO_MAINNET_ADDRESSES,
    metadata: TAIKO_MAINNET_METADATA,
    enabled: shouldEnableChain(TAIKO_MAINNET_CHAIN_ID),
    isDefault: TAIKO_CHAIN_FILTER === 'mainnet' || !TAIKO_CHAIN_FILTER, // Production default if no filter or mainnet filter
  },
  // Taiko Hoodi - ENABLED (testnet, has all verified contracts)
  {
    chainId: TAIKO_HOODI_CHAIN_ID,
    addresses: TAIKO_HOODI_ADDRESSES,
    metadata: TAIKO_HOODI_METADATA,
    enabled: shouldEnableChain(TAIKO_HOODI_CHAIN_ID),
    isDefault: TAIKO_CHAIN_FILTER === 'hoodi', // Default if hoodi filter is set
  },
]

/**
 * Get all chains in the registry (both enabled and disabled)
 * @returns Array of all chain configurations
 */
export function getAllChains(): ChainConfig[] {
  return ALL_CHAINS
}

/**
 * Get only enabled chains (chains with validated contracts)
 * @returns Array of enabled chain configurations
 */
export function getEnabledChains(): ChainConfig[] {
  return ALL_CHAINS.filter((chain) => chain.enabled)
}

/**
 * Get disabled chains (chains with incomplete deployments)
 * @returns Array of disabled chain configurations
 */
export function getDisabledChains(): ChainConfig[] {
  return ALL_CHAINS.filter((chain) => !chain.enabled)
}

/**
 * Get chain configuration by chain ID
 * @param chainId - The chain ID to look up
 * @returns Chain configuration or undefined if not found
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  return ALL_CHAINS.find((chain) => chain.chainId === chainId)
}

/**
 * Check if a chain is enabled in the registry
 * @param chainId - The chain ID to check
 * @returns true if chain is enabled
 */
export function isChainEnabled(chainId: number): boolean {
  const chain = getChainConfig(chainId)
  return chain?.enabled ?? false
}

/**
 * Get the default chain configuration
 * Returns the first enabled chain marked as default, or the first enabled chain if none marked
 * @returns Default chain configuration
 * @throws Error if no enabled chains are available
 */
export function getDefaultChain(): ChainConfig {
  const enabledChains = getEnabledChains()

  if (enabledChains.length === 0) {
    throw new Error('No enabled chains available in registry')
  }

  // Find chain marked as default
  const defaultChain = enabledChains.find((chain) => chain.isDefault)

  // Return default chain or first enabled chain
  return defaultChain ?? enabledChains[0]
}

/**
 * Get the default chain ID
 * @returns Default chain ID
 */
export function getDefaultChainId(): number {
  return getDefaultChain().chainId
}

/**
 * Get addresses for a specific chain
 * @param chainId - The chain ID to get addresses for
 * @returns Chain addresses or undefined if chain not found
 */
export function getChainAddresses(chainId: number): ChainAddresses | undefined {
  const chain = getChainConfig(chainId)
  return chain?.addresses
}

/**
 * Get metadata for a specific chain
 * @param chainId - The chain ID to get metadata for
 * @returns Chain metadata or undefined if chain not found
 */
export function getChainMetadata(chainId: number): TaikoChainMetadata | undefined {
  const chain = getChainConfig(chainId)
  return chain?.metadata
}

/**
 * Get all enabled chain IDs
 * @returns Array of enabled chain IDs
 */
export function getEnabledChainIds(): number[] {
  return getEnabledChains().map((chain) => chain.chainId)
}

/**
 * Validate all chains in the registry
 * This function is called on module import to ensure no invalid chains are used
 * @param throwOnError - If true, throws on validation errors (default: true for production)
 */
export function validateRegistry(throwOnError: boolean = true): void {
  const enabledChains = getEnabledChains()

  if (enabledChains.length === 0) {
    const error = new Error(
      'No chains are enabled in the registry. At least one chain must be enabled for the application to function.'
    )
    if (throwOnError) throw error
    console.error(error.message)
    return
  }

  // Validate each enabled chain
  for (const chain of enabledChains) {
    try {
      validateChainAddressesOrThrow(chain.addresses, chain.metadata.name, chain.chainId)
      if (process.env.NODE_ENV === 'development') {
        console.log(`✓ ${chain.metadata.name} (${chain.chainId}) validated successfully`)
      }
    } catch (error) {
      if (throwOnError) {
        throw error
      }
      console.error(`✗ ${chain.metadata.name} (${chain.chainId}) validation failed:`, error)
    }
  }

  // Show summary in development only
  if (process.env.NODE_ENV === 'development') {
    const allValidationResults = validateMultipleChains(
      ALL_CHAINS.map((chain) => ({
        addresses: chain.addresses,
        chainName: chain.metadata.name,
        chainId: chain.chainId,
      }))
    )

    const summary = getValidationSummary(allValidationResults)
    console.log(summary)

    // Log disabled chains
    const disabledChains = getDisabledChains()
    if (disabledChains.length > 0) {
      console.log('\nDisabled Chains (not available in UI):')
      disabledChains.forEach((chain) => {
        console.log(`  - ${chain.metadata.name} (${chain.chainId})`)
      })
    }
  }
}

/**
 * Export convenience maps for quick lookups
 */

/**
 * Map of chain ID to addresses for enabled chains only
 */
export const ENABLED_CHAIN_ADDRESSES: Record<number, ChainAddresses> = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.addresses])
)

/**
 * Map of chain ID to metadata for enabled chains only
 */
export const ENABLED_CHAIN_METADATA: Record<number, TaikoChainMetadata> = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.metadata])
)

/**
 * SDK-compatible address exports for enabled chains
 * These match the format expected by Uniswap SDK
 */
export const V3_CORE_FACTORY_ADDRESSES = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.addresses.factory])
)

export const V3_MIGRATOR_ADDRESSES = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.addresses.v3Migrator])
)

export const MULTICALL_ADDRESSES = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.addresses.multicall])
)

export const QUOTER_ADDRESSES = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.addresses.quoterV2])
)

export const NONFUNGIBLE_POSITION_MANAGER_ADDRESSES = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.addresses.positionManager])
)

export const TICK_LENS_ADDRESSES = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.addresses.tickLens])
)

export const SWAP_ROUTER_02_ADDRESSES = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.addresses.router])
)

export const WETH9_ADDRESSES = Object.fromEntries(
  getEnabledChains().map((chain) => [chain.chainId, chain.addresses.weth9])
)

/**
 * Run validation on module import
 * This ensures the application fails fast if invalid chains are configured
 */
if (process.env.NODE_ENV !== 'test') {
  // Only validate in non-test environments
  validateRegistry(true)
}
