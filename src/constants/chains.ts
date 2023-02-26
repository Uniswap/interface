/**
 * List of all the networks supported by the Uniswap Interface
 */
export enum SupportedChainId {
  FUJI = 43113,
  MAINNET = 9001,
  OPTIMISM = 10,
}

export const CHAIN_IDS_TO_NAMES = {
  [SupportedChainId.MAINNET]: 'evmos',
  [SupportedChainId.FUJI]: 'fuji',
  [SupportedChainId.OPTIMISM]: 'optimism',
}

/**
 * Array of all the supported chain IDs
 */
export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = Object.values(SupportedChainId).filter(
  (id) => typeof id === 'number'
) as SupportedChainId[]

export function isSupportedChain(chainId: number | null | undefined): chainId is SupportedChainId {
  return !!chainId && !!SupportedChainId[chainId]
}

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [SupportedChainId.MAINNET, SupportedChainId.FUJI]

/**
 * Unsupported networks for V2 pool behavior.
 */
export const UNSUPPORTED_V2POOL_CHAIN_IDS = [SupportedChainId.FUJI]

export const TESTNET_CHAIN_IDS = [SupportedChainId.FUJI] as const

export type SupportedTestnetChainId = typeof TESTNET_CHAIN_IDS[number]

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = [SupportedChainId.MAINNET, SupportedChainId.FUJI] as const

export type SupportedL1ChainId = typeof L1_CHAIN_IDS[number]

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = [SupportedChainId.OPTIMISM] as const

export type SupportedL2ChainId = typeof L2_CHAIN_IDS[number]
