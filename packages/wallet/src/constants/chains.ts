// Based on https://github.com/Uniswap/interface/blob/main/src/constants/chains.ts

import { ImageSourcePropType } from 'react-native'
import {
  ARBITRUM_LOGO,
  BASE_LOGO,
  BNB_LOGO,
  ETHEREUM_LOGO,
  GOERLI_LOGO,
  MUMBAI_LOGO,
  OPTIMISM_LOGO,
  POLYGON_LOGO,
} from 'ui/src/assets'
import { config } from 'wallet/src/config'

export enum RPCType {
  Public = 'public',
  Private = 'private',
  PublicAlt = 'public_alternative',
}

// Renamed from SupportedChainId in web app
export enum ChainId {
  Mainnet = 1,
  Goerli = 5,

  ArbitrumOne = 42161,
  Base = 8453,
  Optimism = 10,
  Polygon = 137,
  PolygonMumbai = 80001,
  Bnb = 56,
}

export const ALL_SUPPORTED_CHAINS: string[] = Object.values(ChainId).map((c) => c.toString())

// DON'T CHANGE - order here determines ordering of networks in app
// TODO: [MOB-250] Add back in testnets once our endpoints support them
export const ALL_SUPPORTED_CHAIN_IDS: ChainId[] = [
  ChainId.Mainnet,
  ChainId.Polygon,
  ChainId.ArbitrumOne,
  ChainId.Optimism,
  ChainId.Base,
  ChainId.Bnb,
]

export const TESTNET_CHAIN_IDS = [ChainId.Goerli, ChainId.PolygonMumbai]

export const ETHEREUM_CHAIN_IDS = [ChainId.Mainnet, ChainId.Goerli] as const

// Renamed from SupportedL1ChainId in web app
export type EthereumChainId = (typeof ETHEREUM_CHAIN_IDS)[number]

export const L2_CHAIN_IDS = [
  ChainId.ArbitrumOne,
  ChainId.Base,
  ChainId.Optimism,
  ChainId.Polygon,
  ChainId.PolygonMumbai,
  ChainId.Bnb,
] as const

// Renamed from SupportedL2ChainId in web app
export type L2ChainId = (typeof L2_CHAIN_IDS)[number]

export interface L1ChainInfo {
  readonly blockWaitMsBeforeWarning?: number
  readonly bridge?: string
  readonly docs: string
  readonly explorer: string
  readonly infoLink: string
  readonly label: string
  readonly logoUrl?: string
  readonly logo?: ImageSourcePropType
  readonly rpcUrls?: Partial<{ [key in keyof RPCType as RPCType]: string }>
  readonly nativeCurrency: {
    name: string // 'Goerli ETH',
    symbol: string // 'gorETH',
    decimals: number //18,
  }
}
export interface L2ChainInfo extends L1ChainInfo {
  readonly bridge: string
  readonly statusPage?: string
}

export type ChainInfo = {
  readonly [chainId: number]: L1ChainInfo | L2ChainInfo
} & {
  readonly [chainId in L2ChainId]: L2ChainInfo
} & { readonly [chainId in EthereumChainId]: L1ChainInfo }

export const CHAIN_INFO: ChainInfo = {
  [ChainId.ArbitrumOne]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://arbiscan.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: 'Arbitrum',
    logo: ARBITRUM_LOGO,
    nativeCurrency: { name: 'Arbitrum ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { [RPCType.PublicAlt]: 'https://arb1.arbitrum.io/rpc' },
  },
  [ChainId.Mainnet]: {
    blockWaitMsBeforeWarning: 60000, // 1 minute
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ethereum',
    logo: ETHEREUM_LOGO,
    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    rpcUrls: { [RPCType.Private]: 'https://rpc.mevblocker.io/?referrer=uniswapwallet' },
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
  [ChainId.Base]: {
    blockWaitMsBeforeWarning: 600000,
    bridge: 'https://bridge.base.org/',
    docs: 'https://base.org/',
    explorer: 'https://basescan.org/',
    infoLink: 'https://info.uniswap.org/#/base',
    label: 'Base',
    logo: BASE_LOGO,
    nativeCurrency: { name: 'Base ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { [RPCType.Public]: 'https://mainnet.base.org' },
  },
  [ChainId.Bnb]: {
    blockWaitMsBeforeWarning: 600000,
    bridge: 'https://www.bnbchain.org/bridge',
    docs: 'https://www.bnbchain.org/',
    explorer: 'https://bscscan.com/',
    infoLink: 'https://info.uniswap.org/#/bnb',
    label: 'BNB',
    logo: BNB_LOGO,
    nativeCurrency: { name: 'Binance Coin', symbol: 'BNB', decimals: 18 },
    rpcUrls: { [RPCType.Public]: config.quicknodeBnbRpcUrl },
  },
  [ChainId.Optimism]: {
    blockWaitMsBeforeWarning: 1200000, // 20 minutes
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: 'Optimism',
    logo: OPTIMISM_LOGO,
    nativeCurrency: { name: 'Optimistic ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { [RPCType.PublicAlt]: 'https://mainnet.optimism.io' },
    statusPage: 'https://optimism.io/status',
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
    rpcUrls: { [RPCType.PublicAlt]: 'https://polygon-rpc.com/' },
  },
  [ChainId.PolygonMumbai]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://wallet.polygon.technology/bridge',
    docs: 'https://polygon.io/',
    explorer: 'https://mumbai.polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon Mumbai',
    logo: MUMBAI_LOGO,
    nativeCurrency: {
      name: 'Polygon Mumbai Matic',
      symbol: 'mMATIC',
      decimals: 18,
    },
    rpcUrls: { [RPCType.PublicAlt]: 'https://rpc-endpoints.superfluid.dev/mumbai' },
  },
}
