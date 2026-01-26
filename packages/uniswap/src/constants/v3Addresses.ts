import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Extended V3 Factory addresses that includes chains not in the official SDK
 * For official chains, use V3_CORE_FACTORY_ADDRESSES from @uniswap/sdk-core
 */
export const EXTENDED_V3_FACTORY_ADDRESSES: Record<number, string> = {
  // HashKey Chain Testnet
  [UniverseChainId.HashKeyTestnet]: '0x2dC2c21D1049F786C535bF9d45F999dB5474f3A0',
  // HashKey Chain Mainnet
  [UniverseChainId.HashKey]: '0x2dC2c21D1049F786C535bF9d45F999dB5474f3A0',
}

/**
 * Extended V3 NonfungiblePositionManager addresses for custom chains
 */
export const EXTENDED_V3_POSITION_MANAGER_ADDRESSES: Record<number, string> = {
  // HashKey Chain Testnet
  [UniverseChainId.HashKeyTestnet]: '0x3c8816a838966b8b0927546A1630113F612B1553',
  // HashKey Chain Mainnet
  [UniverseChainId.HashKey]: '0x3c8816a838966b8b0927546A1630113F612B1553',
}

/**
 * Extended V3 SwapRouter02 addresses for custom chains
 */
export const EXTENDED_V3_SWAP_ROUTER_02_ADDRESSES: Record<number, string> = {
  // HashKey Chain Testnet
  [UniverseChainId.HashKeyTestnet]: '0x46cBccE3c74E95d1761435d52B0b9Abc9e2FEAC0',
  // HashKey Chain Mainnet
  [UniverseChainId.HashKey]: '0x46cBccE3c74E95d1761435d52B0b9Abc9e2FEAC0',
}

/**
 * Extended V3 QuoterV2 addresses for custom chains
 */
export const EXTENDED_V3_QUOTER_V2_ADDRESSES: Record<number, string> = {
  // HashKey Chain Testnet
  [UniverseChainId.HashKeyTestnet]: '0x9576241e23629cF8ad3d8ad7b12993935b24fA9d',
  // HashKey Chain Mainnet
  [UniverseChainId.HashKey]: '0x9576241e23629cF8ad3d8ad7b12993935b24fA9d',
}

/**
 * Get V3 Factory address for any chain, including extended chains
 */
export function getV3FactoryAddress(chainId: number): string | undefined {
  // First try to get from extended addresses (custom chains)
  const extendedAddress = EXTENDED_V3_FACTORY_ADDRESSES[chainId]
  if (extendedAddress) {
    return extendedAddress
  }

  // For official chains, import and use V3_CORE_FACTORY_ADDRESSES from SDK
  try {
    const { V3_CORE_FACTORY_ADDRESSES } = require('@uniswap/sdk-core')
    return V3_CORE_FACTORY_ADDRESSES[chainId]
  } catch {
    return undefined
  }
}

/**
 * Get V3 NonfungiblePositionManager address for any chain
 */
export function getV3PositionManagerAddress(chainId: number): string | undefined {
  return EXTENDED_V3_POSITION_MANAGER_ADDRESSES[chainId]
}

/**
 * Get V3 SwapRouter02 address for any chain
 */
export function getV3SwapRouter02Address(chainId: number): string | undefined {
  return EXTENDED_V3_SWAP_ROUTER_02_ADDRESSES[chainId]
}

/**
 * Get V3 QuoterV2 address for any chain
 */
export function getV3QuoterV2Address(chainId: number): string | undefined {
  return EXTENDED_V3_QUOTER_V2_ADDRESSES[chainId]
}
