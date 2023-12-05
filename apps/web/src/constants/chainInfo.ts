import { ChainId } from '@uniswap/sdk-core'
import ms from 'ms'
import { darkTheme } from 'theme/colors'

import { SupportedL1ChainId, SupportedL2ChainId } from './chains'
import { ARBITRUM_LIST, AVALANCHE_LIST, BASE_LIST, CELO_LIST, OPTIMISM_LIST, PLASMA_BNB_LIST } from './lists'

export const AVERAGE_L1_BLOCK_TIME = ms(`12s`)

// The block number at which v3 was deployed on each chain, separate from the UNIVERSAL_ROUTER_CREATION_BLOCK
export const START_BLOCKS: { [key: number]: number } = {
  [ChainId.MAINNET]: 14292820,
  [ChainId.POLYGON]: 25459720,
  [ChainId.ARBITRUM_ONE]: 175,
  [ChainId.OPTIMISM]: 10028767,
  [ChainId.CELO]: 13916355,
  [ChainId.BNB]: 26324014,
  [ChainId.AVALANCHE]: 31422450,
  [ChainId.BASE]: 1371680,
}

export enum NetworkType {
  L1,
  L2,
}
interface BaseChainInfo {
  readonly networkType: NetworkType
  readonly blockWaitMsBeforeWarning?: number
  readonly docs: string
  readonly bridge?: string
  readonly explorer: string
  readonly infoLink: string
  readonly label: string
  readonly helpCenterUrl?: string
  readonly nativeCurrency: {
    name: string // e.g. 'Goerli ETH',
    symbol: string // e.g. 'gorETH',
    decimals: number // e.g. 18,
  }
  readonly color?: string
  readonly backgroundColor?: string
}

interface L1ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L1
  readonly defaultListUrl?: string
}

export interface L2ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L2
  readonly bridge: string
  readonly statusPage?: string
  readonly defaultListUrl: string
}

type ChainInfoMap = { readonly [chainId: number]: L1ChainInfo | L2ChainInfo } & {
  readonly [chainId in SupportedL2ChainId]: L2ChainInfo
} & { readonly [chainId in SupportedL1ChainId]: L1ChainInfo }

const CHAIN_INFO: ChainInfoMap = {
  [ChainId.MAINNET]: {
    networkType: NetworkType.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_1,
  },
  [ChainId.GOERLI]: {
    networkType: NetworkType.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://goerli.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Görli',
    nativeCurrency: { name: 'Görli Ether', symbol: 'görETH', decimals: 18 },
    color: darkTheme.chain_5,
  },
  [ChainId.SEPOLIA]: {
    networkType: NetworkType.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://sepolia.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SepoliaETH', decimals: 18 },
    color: darkTheme.chain_5,
  },
  [ChainId.OPTIMISM]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms(`25m`),
    bridge: 'https://app.optimism.io/bridge',
    defaultListUrl: OPTIMISM_LIST,
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism/',
    label: 'Optimism',
    statusPage: 'https://optimism.io/status',
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_10,
    backgroundColor: darkTheme.chain_10_background,
  },
  [ChainId.OPTIMISM_GOERLI]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms(`25m`),
    bridge: 'https://app.optimism.io/bridge',
    defaultListUrl: OPTIMISM_LIST,
    docs: 'https://optimism.io/',
    explorer: 'https://goerli-optimism.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism/',
    label: 'Optimism Görli',
    statusPage: 'https://optimism.io/status',
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
    nativeCurrency: { name: 'Optimism Goerli Ether', symbol: 'görOpETH', decimals: 18 },
    color: darkTheme.chain_420,
  },
  [ChainId.ARBITRUM_ONE]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://arbiscan.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: 'Arbitrum',
    defaultListUrl: ARBITRUM_LIST,
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_42,
    backgroundColor: darkTheme.chain_42161_background,
  },
  [ChainId.ARBITRUM_GOERLI]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://goerli.arbiscan.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum/',
    label: 'Arbitrum Goerli',
    defaultListUrl: ARBITRUM_LIST, // TODO: use arbitrum goerli token list
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
    nativeCurrency: { name: 'Goerli Arbitrum Ether', symbol: 'goerliArbETH', decimals: 18 },
    color: darkTheme.chain_421613,
  },
  [ChainId.POLYGON]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://wallet.polygon.technology/polygon/bridge',
    docs: 'https://polygon.io/',
    explorer: 'https://polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon',
    nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
    color: darkTheme.chain_137,
    backgroundColor: darkTheme.chain_137_background,
  },
  [ChainId.POLYGON_MUMBAI]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://wallet.polygon.technology/polygon/bridge/deposit',
    docs: 'https://polygon.io/',
    explorer: 'https://mumbai.polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon Mumbai',
    nativeCurrency: { name: 'Polygon Mumbai Matic', symbol: 'mMATIC', decimals: 18 },
  },
  [ChainId.CELO]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://www.portalbridge.com/#/transfer',
    docs: 'https://docs.celo.org/',
    explorer: 'https://celoscan.io/',
    infoLink: 'https://info.uniswap.org/#/celo/',
    label: 'Celo',
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
    defaultListUrl: CELO_LIST,
  },
  [ChainId.CELO_ALFAJORES]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://www.portalbridge.com/#/transfer',
    docs: 'https://docs.celo.org/',
    explorer: 'https://alfajores-blockscout.celo-testnet.org/',
    infoLink: 'https://info.uniswap.org/#/celo/',
    label: 'Celo Alfajores',
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
    defaultListUrl: CELO_LIST,
  },
  [ChainId.BNB]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://cbridge.celer.network/1/56',
    docs: 'https://docs.bnbchain.org/',
    explorer: 'https://bscscan.com/',
    infoLink: 'https://info.uniswap.org/#/bnb/',
    label: 'BNB Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    defaultListUrl: PLASMA_BNB_LIST,
    color: darkTheme.chain_56,
    backgroundColor: darkTheme.chain_56_background,
  },
  [ChainId.AVALANCHE]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://core.app/bridge/',
    docs: 'https://docs.avax.network/',
    explorer: 'https://snowtrace.io/',
    infoLink: 'https://info.uniswap.org/#/avax/', // TODO(WEB-2336): Add avax support to info site
    label: 'Avalanche',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    defaultListUrl: AVALANCHE_LIST,
    color: darkTheme.chain_43114,
    backgroundColor: darkTheme.chain_43114_background,
  },
  [ChainId.BASE]: {
    networkType: NetworkType.L2,
    blockWaitMsBeforeWarning: ms(`25m`),
    bridge: 'https://bridge.base.org/deposit',
    defaultListUrl: BASE_LIST,
    docs: 'https://docs.base.org',
    explorer: 'https://basescan.org/',
    infoLink: 'https://info.uniswap.org/#/base/',
    label: 'Base',
    statusPage: 'https://status.base.org/',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_84531,
  },
} as const

export function getChainInfo(
  chainId: SupportedL1ChainId,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): L1ChainInfo
export function getChainInfo(
  chainId: SupportedL2ChainId,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): L2ChainInfo
export function getChainInfo(
  chainId: ChainId,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): L1ChainInfo | L2ChainInfo
export function getChainInfo(
  chainId: ChainId | SupportedL1ChainId | SupportedL2ChainId | number | undefined,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): L1ChainInfo | L2ChainInfo | undefined

/**
 * Overloaded method for returning ChainInfo given a chainID
 * Return type varies depending on input type:
 * number | undefined -> returns chaininfo | undefined
 * ChainId -> returns L1ChainInfo | L2ChainInfo
 * SupportedL1ChainId -> returns L1ChainInfo
 * SupportedL2ChainId -> returns L2ChainInfo
 */
export function getChainInfo(
  chainId: any,
  featureFlags?: Record<ChainId | SupportedL1ChainId | SupportedL2ChainId | number, boolean>
): any {
  if (featureFlags && chainId in featureFlags) {
    return featureFlags[chainId] ? CHAIN_INFO[chainId] : undefined
  }
  if (chainId) {
    return CHAIN_INFO[chainId] ?? undefined
  }
  return undefined
}

const MAINNET_INFO = CHAIN_INFO[ChainId.MAINNET]
export function getChainInfoOrDefault(chainId: number | undefined, featureFlags?: Record<number, boolean>) {
  return getChainInfo(chainId, featureFlags) ?? MAINNET_INFO
}
