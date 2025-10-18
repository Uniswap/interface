import { ChainId, SUPPORTED_CHAINS, SupportedChainsType } from '@uniswap/sdk-core'

import { TAIKO_HOODI_CHAIN_ID, getEnabledChainIds } from 'config/chains'

// Get enabled Taiko chains from the validated registry
const ENABLED_TAIKO_CHAIN_IDS = getEnabledChainIds()

export const CHAIN_IDS_TO_NAMES = {
  [ChainId.MAINNET]: 'mainnet',
  [ChainId.GOERLI]: 'goerli',
  [ChainId.SEPOLIA]: 'sepolia',
  [ChainId.POLYGON]: 'polygon',
  [ChainId.POLYGON_MUMBAI]: 'polygon_mumbai',
  [ChainId.CELO]: 'celo',
  [ChainId.CELO_ALFAJORES]: 'celo_alfajores',
  [ChainId.ARBITRUM_ONE]: 'arbitrum',
  [ChainId.ARBITRUM_GOERLI]: 'arbitrum_goerli',
  [ChainId.OPTIMISM]: 'optimism',
  [ChainId.OPTIMISM_GOERLI]: 'optimism_goerli',
  [ChainId.BNB]: 'bnb',
  [ChainId.AVALANCHE]: 'avalanche',
  [ChainId.BASE]: 'base',
  // Only enabled Taiko chains (Taiko Mainnet removed due to zero addresses)
  [TAIKO_HOODI_CHAIN_ID]: 'taiko_hoodi',
} as const

// Include ChainIds in this array if they are not supported by the UX yet, but are already in the SDK.
const NOT_YET_UX_SUPPORTED_CHAIN_IDS: number[] = [ChainId.BASE_GOERLI]

// Custom chains not in SDK - only enabled chains from registry
const CUSTOM_SUPPORTED_CHAIN_IDS: number[] = ENABLED_TAIKO_CHAIN_IDS

// TODO: include BASE_GOERLI when routing is implemented
// Note: Only enabled Taiko chains are included (Taiko Mainnet excluded due to zero addresses)
export type SupportedInterfaceChain = Exclude<SupportedChainsType, ChainId.BASE_GOERLI> | typeof TAIKO_HOODI_CHAIN_ID

export function isSupportedChain(
  chainId: number | null | undefined | ChainId,
  featureFlags?: Record<number, boolean>
): chainId is SupportedInterfaceChain {
  if (featureFlags && chainId && chainId in featureFlags) {
    return featureFlags[chainId]
  }
  return (
    !!chainId &&
    (SUPPORTED_CHAINS.indexOf(chainId) !== -1 || CUSTOM_SUPPORTED_CHAIN_IDS.indexOf(chainId) !== -1) &&
    NOT_YET_UX_SUPPORTED_CHAIN_IDS.indexOf(chainId) === -1
  )
}

export function asSupportedChain(
  chainId: number | null | undefined | ChainId,
  featureFlags?: Record<number, boolean>
): SupportedInterfaceChain | undefined {
  if (!chainId) return undefined
  if (featureFlags && chainId in featureFlags && !featureFlags[chainId]) {
    return undefined
  }
  return isSupportedChain(chainId) ? chainId : undefined
}

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.POLYGON,
  ChainId.CELO,
  ChainId.OPTIMISM,
  ChainId.ARBITRUM_ONE,
  ChainId.BNB,
  ChainId.AVALANCHE,
  ChainId.BASE,
] as const

/**
 * Supported networks for V2 pool behavior.
 */
export const SUPPORTED_V2POOL_CHAIN_IDS = [ChainId.MAINNET, ChainId.GOERLI] as const

export const TESTNET_CHAIN_IDS = [
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON_MUMBAI,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM_GOERLI,
  ChainId.CELO_ALFAJORES,
  TAIKO_HOODI_CHAIN_ID,
] as const

export const MAINNET_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.POLYGON,
  ChainId.CELO,
  ChainId.ARBITRUM_ONE,
  ChainId.OPTIMISM,
  ChainId.BNB,
  ChainId.AVALANCHE,
  ChainId.BASE,
  // Taiko Mainnet excluded - not yet fully deployed
] as const

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.BNB,
  ChainId.AVALANCHE,
] as const

export type SupportedL1ChainId = (typeof L1_CHAIN_IDS)[number]

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = [
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.BASE,
  TAIKO_HOODI_CHAIN_ID,
  // Taiko Mainnet excluded - not yet fully deployed
] as const

export type SupportedL2ChainId = (typeof L2_CHAIN_IDS)[number]

/**
 * Get the priority of a chainId based on its relevance to the user.
 * @param {ChainId} chainId - The chainId to determine the priority for.
 * @returns {number} The priority of the chainId, the lower the priority, the earlier it should be displayed, with base of MAINNET=0.
 */
export function getChainPriority(chainId: ChainId | number): number {
  switch (chainId) {
    // Taiko Hoodi is highest priority (only enabled Taiko chain)
    case TAIKO_HOODI_CHAIN_ID:
      return 0
    case ChainId.MAINNET:
    case ChainId.GOERLI:
    case ChainId.SEPOLIA:
      return 1
    case ChainId.ARBITRUM_ONE:
    case ChainId.ARBITRUM_GOERLI:
      return 2
    case ChainId.OPTIMISM:
    case ChainId.OPTIMISM_GOERLI:
      return 3
    case ChainId.POLYGON:
    case ChainId.POLYGON_MUMBAI:
      return 4
    case ChainId.BASE:
      return 5
    case ChainId.BNB:
      return 6
    case ChainId.AVALANCHE:
      return 7
    case ChainId.CELO:
    case ChainId.CELO_ALFAJORES:
      return 8
    default:
      return 10
  }
}

export function isUniswapXSupportedChain(chainId: number) {
  return chainId === ChainId.MAINNET
}
