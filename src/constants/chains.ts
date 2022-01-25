// Based on https://github.com/Uniswap/interface/blob/main/src/constants/chains.ts

import {
  ARBITRUM_LOGO,
  ETHEREUM_LOGO,
  GOERLI_LOGO,
  KOVAN_LOGO,
  OPTIMISM_LOGO,
  OPTIMISTIC_KOVAN_LOGO,
  RINKEBY_LOGO,
  ROPSTEN_LOGO,
} from 'src/assets'

export type ChainIdTo<T> = Partial<Record<ChainId, T>>
export type ChainIdToAddressTo<T> = ChainIdTo<AddressTo<T>>

// Renamed from SupportedChainId in web app
export enum ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GOERLI = 5,
  KOVAN = 42,

  ARBITRUM_ONE = 42161,
  ARBITRUM_RINKEBY = 421611,
  OPTIMISM = 10,
  OPTIMISTIC_KOVAN = 69,
}

export const ALL_SUPPORTED_CHAIN_IDS: ChainId[] = [
  ChainId.MAINNET,
  ChainId.ROPSTEN,
  ChainId.RINKEBY,
  ChainId.GOERLI,
  ChainId.KOVAN,

  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_RINKEBY,
  ChainId.OPTIMISM,
  ChainId.OPTIMISTIC_KOVAN,
]

export const L1_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.ROPSTEN,
  ChainId.RINKEBY,
  ChainId.GOERLI,
  ChainId.KOVAN,
] as const

// Renamed from SupportedL1ChainId in web app
export type L1ChainId = typeof L1_CHAIN_IDS[number]

export const L2_CHAIN_IDS = [
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_RINKEBY,
  ChainId.OPTIMISM,
  ChainId.OPTIMISTIC_KOVAN,
] as const

// Renamed from SupportedL2ChainId in web app
export type L2ChainId = typeof L2_CHAIN_IDS[number]

export const MAINNET_CHAIN_IDS = [ChainId.MAINNET, ChainId.ARBITRUM_ONE, ChainId.OPTIMISM]

export interface L1ChainInfo {
  readonly blockWaitMsBeforeWarning?: number
  readonly docs: string
  readonly explorer: string
  readonly infoLink: string
  readonly label: string
  readonly logoUrl?: string
  readonly logo?: any
  readonly rpcUrls?: string[]
  readonly subgraphUrl?: string
  readonly nativeCurrency: {
    name: string // 'Goerli ETH',
    symbol: string // 'gorETH',
    decimals: number //18,
  }
}
export interface L2ChainInfo extends L1ChainInfo {
  readonly bridge: string
  readonly logoUrl?: string
  readonly statusPage?: string
}

export type ChainInfo = { readonly [chainId: number]: L1ChainInfo | L2ChainInfo } & {
  readonly [chainId in L2ChainId]: L2ChainInfo
} & { readonly [chainId in L1ChainId]: L1ChainInfo }

export const CHAIN_INFO: ChainInfo = {
  [ChainId.ARBITRUM_ONE]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://arbiscan.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: 'Arbitrum',
    logo: ARBITRUM_LOGO,
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal',
  },
  [ChainId.ARBITRUM_RINKEBY]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://rinkeby-explorer.arbitrum.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum/',
    label: 'Arbitrum Rinkeby',
    nativeCurrency: { name: 'Rinkeby ArbETH', symbol: 'rinkArbETH', decimals: 18 },
    rpcUrls: ['https://rinkeby.arbitrum.io/rpc'],
  },
  [ChainId.MAINNET]: {
    blockWaitMsBeforeWarning: 60000, // 1 minute
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ethereum',
    logo: ETHEREUM_LOGO,
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  },
  [ChainId.RINKEBY]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://rinkeby.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Rinkeby',
    logo: RINKEBY_LOGO,
    nativeCurrency: { name: 'Rinkeby ETH', symbol: 'rinkETH', decimals: 18 },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-rinkeby',
  },
  [ChainId.ROPSTEN]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://ropsten.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ropsten',
    logo: ROPSTEN_LOGO,
    nativeCurrency: { name: 'Ropsten ETH', symbol: 'ropETH', decimals: 18 },
  },
  [ChainId.KOVAN]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://kovan.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Kovan',
    logo: KOVAN_LOGO,
    nativeCurrency: { name: 'Kovan ETH', symbol: 'kovETH', decimals: 18 },
  },
  [ChainId.GOERLI]: {
    blockWaitMsBeforeWarning: 180000, // 3 minutes
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://goerli.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Görli',
    logo: GOERLI_LOGO,
    nativeCurrency: { name: 'Görli ETH', symbol: 'görETH', decimals: 18 },
  },
  [ChainId.OPTIMISM]: {
    blockWaitMsBeforeWarning: 1200000, // 20 minutes
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: 'OΞ',
    logo: OPTIMISM_LOGO,
    nativeCurrency: { name: 'Optimistic ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.optimism.io'],
    statusPage: 'https://optimism.io/status',
  },
  [ChainId.OPTIMISTIC_KOVAN]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: 'Optimistic Kovan',
    logo: OPTIMISTIC_KOVAN_LOGO,
    rpcUrls: ['https://kovan.optimism.io'],
    nativeCurrency: { name: 'Optimistic kovETH', symbol: 'kovOpETH', decimals: 18 },
    statusPage: 'https://optimism.io/status',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-optimism-dev',
  },
}

export const ARBITRUM_HELP_CENTER_LINK =
  'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum'
export const OPTIMISM_HELP_CENTER_LINK =
  'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ'
