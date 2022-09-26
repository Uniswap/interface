/**
 * List of all the networks supported by the Uniswap Interface
 */
export enum SupportedChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GOERLI = 5,
  KOVAN = 42,

  ARBITRUM_ONE = 42161,
  ARBITRUM_RINKEBY = 421611,

  OPTIMISM = 10,
  OPTIMISM_GOERLI = 420,

  POLYGON = 137,
  POLYGON_MUMBAI = 80001,

  CELO = 42220,
  CELO_ALFAJORES = 44787,
}

export const CHAIN_IDS_TO_NAMES = {
  [SupportedChainId.MAINNET]: 'mainnet',
  [SupportedChainId.ROPSTEN]: 'ropsten',
  [SupportedChainId.RINKEBY]: 'rinkeby',
  [SupportedChainId.GOERLI]: 'goerli',
  [SupportedChainId.KOVAN]: 'kovan',
  [SupportedChainId.POLYGON]: 'polygon',
  [SupportedChainId.POLYGON_MUMBAI]: 'polygon_mumbai',
  [SupportedChainId.CELO]: 'celo',
  [SupportedChainId.CELO_ALFAJORES]: 'celo_alfajores',
  [SupportedChainId.ARBITRUM_ONE]: 'arbitrum',
  [SupportedChainId.ARBITRUM_RINKEBY]: 'arbitrum_rinkeby',
  [SupportedChainId.OPTIMISM]: 'optimism',
  [SupportedChainId.OPTIMISM_GOERLI]: 'optimism_goerli',
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

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [
  SupportedChainId.MAINNET,
  SupportedChainId.POLYGON,
  SupportedChainId.CELO,
  SupportedChainId.OPTIMISM,
  SupportedChainId.ARBITRUM_ONE,
]

/**
 * Unsupported networks for V2 pool behavior.
 */
export const UNSUPPORTED_V2POOL_CHAIN_IDS = [
  SupportedChainId.POLYGON,
  SupportedChainId.OPTIMISM,
  SupportedChainId.ARBITRUM_ONE,
]

export const TESTNET_CHAIN_IDS = [
  SupportedChainId.ROPSTEN,
  SupportedChainId.RINKEBY,
  SupportedChainId.GOERLI,
  SupportedChainId.KOVAN,
  SupportedChainId.POLYGON_MUMBAI,
  SupportedChainId.ARBITRUM_RINKEBY,
  SupportedChainId.OPTIMISM_GOERLI,
] as const

export type SupportedTestnetChainId = typeof TESTNET_CHAIN_IDS[number]

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = [
  SupportedChainId.MAINNET,
  SupportedChainId.ROPSTEN,
  SupportedChainId.RINKEBY,
  SupportedChainId.GOERLI,
  SupportedChainId.KOVAN,
  SupportedChainId.POLYGON,
  SupportedChainId.POLYGON_MUMBAI,
  SupportedChainId.CELO,
  SupportedChainId.CELO_ALFAJORES,
] as const

export type SupportedL1ChainId = typeof L1_CHAIN_IDS[number]

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = [
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.ARBITRUM_RINKEBY,
  SupportedChainId.OPTIMISM,
  SupportedChainId.OPTIMISM_GOERLI,
] as const

export type SupportedL2ChainId = typeof L2_CHAIN_IDS[number]
