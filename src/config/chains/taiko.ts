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

  // Periphery Contracts
  router: '0x482233e4DBD56853530fA1918157CE59B60dF230', // SwapRouter02
  positionManager: '0x2C745eEDC8493D698545F92E5D69B5E9fA6bCE62', // NonfungiblePositionManager
  quoterV2: '0xAC8D93657DCc5C0dE9d9AF2772aF9eA3A032a1C6', // QuoterV2
  multicall: '0x323dD97aF6DDc101eF306c5daA6aE34c15EA37B7',
  tickLens: '0x6283971D01E3f34cAa2a7163Bb38499eC01Cc63D',

  // Advanced Routing & Approvals
  v3Migrator: '0xB86e3226b2045934B2FEfb1028d75e61795CAD76', // V3Migrator
  v3Staker: '0xef840140Dd75eC5Fa4Aa0002aEa52a8937da2611', // V3Staker

  // Governance & Admin
  proxyAdmin: '0x6a794430DC233E3433E8a70d1a900923fd3cB9e3', // NFTDescriptor
  nftDescriptorProxy: '0x9c340C8616B4Df5dD49Cc873c4561A45101BF86b', // NonfungibleTokenPositionDescriptor
  nftDescriptorImplementation: '0xab32FfaA9D67279Ba685934DD19079F9F3Cd2FC3',
  nftDescriptorLibrary: '0xD80C8Cc7926D670093cd309Ae6Cff9b27b425fC5',
}

/**
 * Taiko Mainnet Configuration
 *
 * All core contracts have been deployed and verified on Taiko Mainnet.
 * Explorer: https://taikoscan.io/
 * RPC: https://rpc.mainnet.taiko.xyz
 *
 * NOTE: nftDescriptorImplementation not provided - set to zero address.
 * This may affect NFT position metadata display but won't prevent trading.
 */
export const TAIKO_MAINNET_ADDRESSES: ChainAddresses = {
  // Core Protocol
  weth9: '0xA51894664A773981C6C112C43ce576f315d5b1B6', // WETH
  factory: '0x826D713e30f0bF09Dd3219494A508E6B30327d4f', // V3 Factory

  // Periphery Contracts
  router: '0x1024Ea017b00F15591846f4E6E893abDe2e37cc8', // SwapRouter02
  positionManager: '0xf26F8d1DA08aD278D0B65403A04E918341680aDC', // NonfungiblePositionManager
  quoterV2: '0xcBa70D57be34aA26557B8E80135a9B7754680aDb', // QuoterV2
  multicall: '0x81504E4F564CC0AC5Ce35A0d79d33acE5099a59B', // UniswapInterfaceMulticall
  tickLens: '0x43B186781146C24594899100C69C697850D179C7', // TickLens

  // Additional Contracts
  v3Migrator: '0x960a28a6972608d58e45034f856a96264d3592a8', // V3Migrator
  v3Staker: '0x599F6c1a35d92ed10Fd23e0eA86642F61d4d6D08', // UniswapV3Staker

  // Governance & Admin
  proxyAdmin: '0xc5C62C40E9F764053605e40397FF983968186195', // ProxyAdmin
  nftDescriptorProxy: '0xee9C1AC3824835E9561396263a2332C44aACE1EF', // NonfungibleTokenPositionDescriptor
  nftDescriptorImplementation: '0x0000000000000000000000000000000000000000', // Not provided - set to zero
  nftDescriptorLibrary: '0x9ae4f49D5e9e64187D3b338541296D34e34c3838', // NFTDescriptor
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
  [TAIKO_MAINNET_CHAIN_ID]: '0x0000000000000000000000000000000000000000', // TODO: Deploy UniversalRouter
  [TAIKO_HOODI_CHAIN_ID]: '0x2F9c5E6f9f178CE0447a4e7e61EE5a07C990540f', // UniversalRouter v1.6.0 (Solidity 0.8.17, Shanghai EVM, V3-only)
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
