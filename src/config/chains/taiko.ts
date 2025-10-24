/**
 * Taiko Chain Configurations
 *
 * This module contains validated Taiko chain configurations.
 * Only chains with verified, non-zero contract addresses are included.
 *
 * @module config/chains/taiko
 */

import { ChainAddresses } from './validation'

/**
 * Custom ChainIds for Taiko networks
 */
export const TAIKO_MAINNET_CHAIN_ID = 167000 as const
export const TAIKO_HOODI_CHAIN_ID = 167013 as const

/**
 * Taiko Hoodi Testnet Configuration
 *
 * All contracts have been verified and deployed on Taiko Hoodi.
 * Explorer: https://hoodi.taikoscan.io/
 * RPC: https://rpc.hoodi.taiko.xyz
 */
export const TAIKO_HOODI_ADDRESSES: ChainAddresses = {
  // Core Protocol
  weth9: '0x3B39685B5495359c892DDD1057B5712F49976835',
  factory: '0x87C772301B2054D47e2b12c4C3C402481158B7f2',

  // Periphery Contracts - UPDATED with new deployments
  router: '0x482233e4DBD56853530fA1918157CE59B60dF230', // SwapRouter - NEW
  positionManager: '0x2C745eEDC8493D698545F92E5D69B5E9fA6bCE62', // NonfungiblePositionManager - NEW
  quoterV2: '0x39d15C3272A54a04C98847302FFF0b44283715F9', // Quoter - NEW
  multicall: '0x323dD97aF6DDc101eF306c5daA6aE34c15EA37B7',
  tickLens: '0x6283971D01E3f34cAa2a7163Bb38499eC01Cc63D',

  // Additional Contracts
  v3Migrator: '0xB86e3226b2045934B2FEfb1028d75e61795CAD76', // V3Migrator - NEW
  v3Staker: '0xef840140Dd75eC5Fa4Aa0002aEa52a8937da2611', // SwapRouter (v1)

  // Governance & Admin
  proxyAdmin: '0x6a794430DC233E3433E8a70d1a900923fd3cB9e3', // NFTDescriptor
  nftDescriptorProxy: '0x9c340C8616B4Df5dD49Cc873c4561A45101BF86b', // NonfungibleTokenPositionDescriptor - NEW
  nftDescriptorImplementation: '0xab32FfaA9D67279Ba685934DD19079F9F3Cd2FC3',
  nftDescriptorLibrary: '0xD80C8Cc7926D670093cd309Ae6Cff9b27b425fC5',
}

/**
 * Taiko Mainnet Configuration
 *
 * NOTE: This configuration is currently DISABLED due to incomplete contract deployments.
 * Only positionManager has been verified. Other contracts have zero addresses.
 *
 * To enable Taiko Mainnet:
 * 1. Verify all contract deployments on https://taikoscan.io/
 * 2. Update addresses below with verified deployments
 * 3. Add to enabled chains in registry.ts
 * 4. Validation will automatically run
 *
 * Explorer: https://taikoscan.io/
 * RPC: https://rpc.mainnet.taiko.xyz
 */
export const TAIKO_MAINNET_ADDRESSES: ChainAddresses = {
  // Core Protocol
  weth9: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  factory: '0x0000000000000000000000000000000000000000', // TODO: Verify - typically 0x1F98431c8aD98523631AE4a59f267346ea31F984

  // Periphery Contracts
  router: '0x0000000000000000000000000000000000000000', // TODO: Verify - typically 0xe592427a0AEce92De3Edee1F18E0157C05861564
  positionManager: '0x8b3c541c30f9b29560f56b9e44b59718916b69ef', // CONFIRMED on taikoscan.io
  quoterV2: '0x0000000000000000000000000000000000000000', // TODO: Verify - typically 0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6
  multicall: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  tickLens: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment

  // Additional Contracts
  v3Migrator: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  v3Staker: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment

  // Governance & Admin
  proxyAdmin: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  nftDescriptorProxy: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  nftDescriptorImplementation: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  nftDescriptorLibrary: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
}

/**
 * Chain metadata for Taiko networks
 */
export interface TaikoChainMetadata {
  chainId: number
  name: string
  rpcUrl: string
  explorerUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  isTestnet: boolean
}

/**
 * Taiko Hoodi metadata
 */
export const TAIKO_HOODI_METADATA: TaikoChainMetadata = {
  chainId: TAIKO_HOODI_CHAIN_ID,
  name: 'Taiko Hoodi',
  rpcUrl: 'https://rpc.hoodi.taiko.xyz',
  explorerUrl: 'https://hoodi.taikoscan.io/',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  isTestnet: true,
}

/**
 * Taiko Mainnet metadata
 */
export const TAIKO_MAINNET_METADATA: TaikoChainMetadata = {
  chainId: TAIKO_MAINNET_CHAIN_ID,
  name: 'Taiko',
  rpcUrl: 'https://rpc.mainnet.taiko.xyz',
  explorerUrl: 'https://taikoscan.io/',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  isTestnet: false,
}

/**
 * Universal Router addresses for Taiko networks
 */
export const TAIKO_UNIVERSAL_ROUTER_ADDRESS = {
  [TAIKO_MAINNET_CHAIN_ID]: '0x0000000000000000000000000000000000000000', // TODO: Update with actual deployment
  [TAIKO_HOODI_CHAIN_ID]: '0x290265ACd21816EE414E64eEC77dd490d8dd9f51', // Verified deployment (SwapRouter02)
} as const

/**
 * Get Universal Router address for a Taiko chain
 * @param chainId - The Taiko chain ID
 * @returns The Universal Router address or undefined if not deployed
 */
export function getTaikoUniversalRouterAddress(chainId: number): string | undefined {
  if (chainId === TAIKO_MAINNET_CHAIN_ID || chainId === TAIKO_HOODI_CHAIN_ID) {
    const address = TAIKO_UNIVERSAL_ROUTER_ADDRESS[chainId as keyof typeof TAIKO_UNIVERSAL_ROUTER_ADDRESS]
    // Return undefined for zero addresses (not deployed)
    return address !== '0x0000000000000000000000000000000000000000' ? address : undefined
  }
  return undefined
}

/**
 * Check if a chain ID is a Taiko chain
 * @param chainId - Chain ID to check
 * @returns true if chain is a Taiko chain
 */
export function isTaikoChain(chainId: number): boolean {
  return chainId === TAIKO_MAINNET_CHAIN_ID || chainId === TAIKO_HOODI_CHAIN_ID
}

/**
 * Check if a chain ID is Taiko Hoodi testnet
 * @param chainId - Chain ID to check
 * @returns true if chain is Taiko Hoodi
 */
export function isTaikoHoodi(chainId: number): boolean {
  return chainId === TAIKO_HOODI_CHAIN_ID
}

/**
 * Check if a chain ID is Taiko Mainnet
 * @param chainId - Chain ID to check
 * @returns true if chain is Taiko Mainnet
 */
export function isTaikoMainnet(chainId: number): boolean {
  return chainId === TAIKO_MAINNET_CHAIN_ID
}
