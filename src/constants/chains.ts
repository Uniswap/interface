// Based on https://github.com/Uniswap/interface/blob/main/src/constants/chains.ts

import {
  ARBITRUM_LOGO,
  ETHEREUM_LOGO,
  GOERLI_LOGO,
  KOVAN_LOGO,
  OPTIMISM_LOGO,
  OPTIMISTIC_KOVAN_LOGO,
  POLYGON_LOGO,
  RINKEBY_LOGO,
  ROPSTEN_LOGO,
} from 'src/assets'

export type ChainIdTo<T> = Partial<Record<ChainId, T>>
export type ChainIdToAddressTo<T> = ChainIdTo<AddressTo<T>>

// Renamed from SupportedChainId in web app
export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,

  ArbitrumOne = 42161,
  ArbitrumRinkeby = 421611,
  Optimism = 10,
  OptimisticKovan = 69,
  Polygon = 137,
  PolygonMumbai = 80001,
}

export const ALL_SUPPORTED_CHAIN_IDS: ChainId[] = [
  ChainId.Mainnet,
  ChainId.Ropsten,
  ChainId.Rinkeby,
  ChainId.Goerli,
  ChainId.Kovan,

  ChainId.ArbitrumOne,
  ChainId.ArbitrumRinkeby,
  ChainId.Optimism,
  ChainId.OptimisticKovan,
  ChainId.Polygon,
  ChainId.PolygonMumbai,
]

export const L1_CHAIN_IDS = [
  ChainId.Mainnet,
  ChainId.Ropsten,
  ChainId.Rinkeby,
  ChainId.Goerli,
  ChainId.Kovan,
  ChainId.Polygon,
  ChainId.PolygonMumbai,
] as const

// Renamed from SupportedL1ChainId in web app
export type L1ChainId = typeof L1_CHAIN_IDS[number]

export const L2_CHAIN_IDS = [
  ChainId.ArbitrumOne,
  ChainId.ArbitrumRinkeby,
  ChainId.Optimism,
  ChainId.OptimisticKovan,
] as const

// Renamed from SupportedL2ChainId in web app
export type L2ChainId = typeof L2_CHAIN_IDS[number]

export const MAINNET_CHAIN_IDS = [
  ChainId.Mainnet,
  ChainId.ArbitrumOne,
  ChainId.Optimism,
  ChainId.Polygon,
]

export interface L1ChainInfo {
  readonly blockWaitMsBeforeWarning?: number
  readonly bridge?: string
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
  [ChainId.ArbitrumOne]: {
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
  [ChainId.ArbitrumRinkeby]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://rinkeby-explorer.arbitrum.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum/',
    label: 'Arbitrum Rinkeby',
    nativeCurrency: { name: 'Rinkeby ArbETH', symbol: 'rinkArbETH', decimals: 18 },
    rpcUrls: ['https://rinkeby.arbitrum.io/rpc'],
  },
  [ChainId.Mainnet]: {
    blockWaitMsBeforeWarning: 60000, // 1 minute
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ethereum',
    logo: ETHEREUM_LOGO,
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  },
  [ChainId.Rinkeby]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://rinkeby.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Rinkeby',
    logo: RINKEBY_LOGO,
    nativeCurrency: { name: 'Rinkeby ETH', symbol: 'rinkETH', decimals: 18 },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-rinkeby',
  },
  [ChainId.Ropsten]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://ropsten.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ropsten',
    logo: ROPSTEN_LOGO,
    nativeCurrency: { name: 'Ropsten ETH', symbol: 'ropETH', decimals: 18 },
  },
  [ChainId.Kovan]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://kovan.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Kovan',
    logo: KOVAN_LOGO,
    nativeCurrency: { name: 'Kovan ETH', symbol: 'kovETH', decimals: 18 },
  },
  [ChainId.Goerli]: {
    blockWaitMsBeforeWarning: 180000, // 3 minutes
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://goerli.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Görli',
    logo: GOERLI_LOGO,
    nativeCurrency: { name: 'Görli ETH', symbol: 'görETH', decimals: 18 },
  },
  [ChainId.Optimism]: {
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
  [ChainId.OptimisticKovan]: {
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
  [ChainId.Polygon]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://wallet.polygon.technology/bridge',
    docs: 'https://polygon.io/',
    explorer: 'https://polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon',
    logo: POLYGON_LOGO,
    nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com/'],
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
  },
  [ChainId.PolygonMumbai]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://wallet.polygon.technology/bridge',
    docs: 'https://polygon.io/',
    explorer: 'https://mumbai.polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon Mumbai',
    nativeCurrency: { name: 'Polygon Mumbai Matic', symbol: 'mMATIC', decimals: 18 },
    rpcUrls: ['https://rpc-endpoints.superfluid.dev/mumbai'],
  },
}

export const ARBITRUM_HELP_CENTER_LINK =
  'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum'
export const OPTIMISM_HELP_CENTER_LINK =
  'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ'

export function isMatic(chainId: number): chainId is ChainId.Polygon | ChainId.PolygonMumbai {
  return chainId === ChainId.PolygonMumbai || chainId === ChainId.Polygon
}
