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
export const TAIKO_HOODI_CHAIN_ID = 167012 as const

/**
 * Taiko Hoodi Testnet Configuration
 *
 * All contracts have been verified and deployed on Taiko Hoodi.
 * Explorer: https://hekla.taikoscan.io/
 * RPC: https://rpc.hoodi.taiko.xyz
 */
export const TAIKO_HOODI_ADDRESSES: ChainAddresses = {
  // Core Protocol
  weth9: '0x73C251a8005D31900Fe32A309C05d60adf6ba87a',
  factory: '0xF7D0a7B04eBcB07b1bB5992d6B50a5BF55C903af',

  // Periphery Contracts
  router: '0x7812fF6117c838cC025F5cfaD5ac8C300baA0c5D',
  positionManager: '0x6a794430DC233E3433E8a70d1a900923fd3cB9e3',
  quoterV2: '0xef840140Dd75eC5Fa4Aa0002aEa52a8937da2611',
  multicall: '0xA37f6e12b224A3d6AaF5C384876B919b3122B830',
  tickLens: '0xFaF7dd4dF637fdcb9Abe41e98D84b3e4a906A1D0',

  // Additional Contracts
  v3Migrator: '0xe59A68212b91FfAb07195f95c607A2A3CdAf012B',
  v3Staker: '0x01715d9e4b69D25dbf1c4047287CF3f47F070d35',

  // Governance & Admin
  proxyAdmin: '0xa3a3F71bd5a24BC65B4ba80ac14839fAAc7ae5fD',
  nftDescriptorProxy: '0x290265ACd21816EE414E64eEC77dd490d8dd9f51',
  nftDescriptorImplementation: '0x95270d42071FA60dEfdb3F8D29ebaAF1754ab225',
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
  explorerUrl: 'https://hekla.taikoscan.io/',
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
  [TAIKO_HOODI_CHAIN_ID]: '0x7812fF6117c838cC025F5cfaD5ac8C300baA0c5D', // Verified deployment
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
