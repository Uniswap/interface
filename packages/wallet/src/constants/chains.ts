// Based on https://github.com/Uniswap/interface/blob/main/src/constants/chains.ts

import { ImageSourcePropType } from 'react-native'
import { GeneratedIcon, Logos } from 'ui/src'
import {
  ARBITRUM_LOGO,
  BASE_LOGO,
  BLAST_LOGO,
  BNB_LOGO,
  ETHEREUM_LOGO,
  GOERLI_LOGO,
  MUMBAI_LOGO,
  OPTIMISM_LOGO,
  POLYGON_LOGO,
  ZORA_LOGO,
} from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { ChainId } from 'uniswap/src/types/chains'

/** Address that represents native currencies on ETH, Arbitrum, etc. */
export const DEFAULT_NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

export enum RPCType {
  Public = 'public',
  Private = 'private',
  PublicAlt = 'public_alternative',
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
  ChainId.Blast,
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
  ChainId.Blast,
  ChainId.Zora,
] as const

// Renamed from SupportedL2ChainId in web app
export type L2ChainId = (typeof L2_CHAIN_IDS)[number]

export interface L1ChainInfo {
  readonly blockWaitMsBeforeWarning?: number
  readonly bridge?: string
  readonly docs: string
  readonly explorer: {
    name: string
    url: string
    logoLight: GeneratedIcon
    logoDark: GeneratedIcon
  }
  readonly infoLink: string
  readonly label: string
  readonly logoUrl?: string
  readonly logo?: ImageSourcePropType
  readonly rpcUrls?: Partial<{ [key in keyof RPCType as RPCType]: string }>
  readonly nativeCurrency: {
    name: string // 'Goerli ETH',
    symbol: string // 'gorETH',
    decimals: number // 18,
    address: string // '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    explorerLink?: string // Special override for native ETH explorer link
  }
  readonly wrappedNativeCurrency: {
    name: string // 'Wrapped Ether',
    symbol: string // 'WETH',
    decimals: number // 18,
    address: string // '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'
  }
}
export interface L2ChainInfo extends L1ChainInfo {
  readonly bridge: string
  readonly statusPage?: string
}

export type ChainInfo = {
  readonly [chainId in L2ChainId]: L2ChainInfo
} & { readonly [chainId in EthereumChainId]: L1ChainInfo }

export const CHAIN_INFO: ChainInfo = {
  [ChainId.ArbitrumOne]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: {
      name: 'Arbiscan',
      url: 'https://arbiscan.io/',
      logoLight: Logos.ArbiscanLogoLight,
      logoDark: Logos.ArbiscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore/tokens/arbitrum',
    label: 'Arbitrum',
    logo: ARBITRUM_LOGO,
    nativeCurrency: {
      name: 'Arbitrum ETH',
      symbol: 'ETH',
      decimals: 18,
      address: DEFAULT_NATIVE_ADDRESS,
      explorerLink: 'https://arbiscan.io/chart/etherprice',
    },
    wrappedNativeCurrency: {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    },
    rpcUrls: { [RPCType.PublicAlt]: 'https://arb1.arbitrum.io/rpc' },
  },
  [ChainId.Mainnet]: {
    blockWaitMsBeforeWarning: 60000, // 1 minute
    docs: 'https://docs.uniswap.org/',
    explorer: {
      name: 'Etherscan',
      url: 'https://etherscan.io/',
      logoLight: Logos.EtherscanLogoLight,
      logoDark: Logos.EtherscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore',
    label: 'Ethereum',
    logo: ETHEREUM_LOGO,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      address: DEFAULT_NATIVE_ADDRESS,
      explorerLink: 'https://etherscan.io/chart/etherprice',
    },
    wrappedNativeCurrency: {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    },
    rpcUrls: { [RPCType.Private]: 'https://rpc.mevblocker.io/?referrer=uniswapwallet' },
  },
  [ChainId.Goerli]: {
    blockWaitMsBeforeWarning: 180000, // 3 minutes
    docs: 'https://docs.uniswap.org/',
    explorer: {
      name: 'Etherscan',
      url: 'https://goerli.etherscan.io/',
      logoLight: Logos.EtherscanLogoLight,
      logoDark: Logos.EtherscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore',
    label: 'Görli',
    logo: GOERLI_LOGO,
    nativeCurrency: {
      name: 'Görli ETH',
      symbol: 'görETH',
      decimals: 18,
      address: DEFAULT_NATIVE_ADDRESS,
      explorerLink: 'https://etherscan.io/chart/etherprice', // goerli.etherscan.io doesn't work
    },
    wrappedNativeCurrency: {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
    },
  },
  [ChainId.Base]: {
    blockWaitMsBeforeWarning: 600000,
    bridge: 'https://bridge.base.org/',
    docs: 'https://base.org/',
    explorer: {
      name: 'BaseScan',
      url: 'https://basescan.org/',
      logoLight: Logos.EtherscanLogoLight,
      logoDark: Logos.EtherscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore/tokens/base',
    label: 'Base',
    logo: BASE_LOGO,
    nativeCurrency: {
      name: 'Base ETH',
      symbol: 'ETH',
      decimals: 18,
      address: DEFAULT_NATIVE_ADDRESS,
      explorerLink: 'https://basescan.org/chart/etherprice',
    },
    wrappedNativeCurrency: {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000006',
    },
    rpcUrls: { [RPCType.Public]: 'https://mainnet.base.org' },
  },
  [ChainId.Bnb]: {
    blockWaitMsBeforeWarning: 600000,
    bridge: 'https://www.bnbchain.org/bridge',
    docs: 'https://www.bnbchain.org/',
    explorer: {
      name: 'BscScan',
      url: 'https://bscscan.com/',
      logoLight: Logos.EtherscanLogoLight,
      logoDark: Logos.EtherscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore/tokens/bnb',
    label: 'BNB',
    logo: BNB_LOGO,
    nativeCurrency: {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
      address: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
    },
    wrappedNativeCurrency: {
      name: 'Wrapped BNB',
      symbol: 'WBNB',
      decimals: 18,
      address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    },
    rpcUrls: { [RPCType.Public]: config.quicknodeBnbRpcUrl },
  },
  [ChainId.Optimism]: {
    blockWaitMsBeforeWarning: 1200000, // 20 minutes
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: {
      name: 'OP Etherscan',
      url: 'https://optimistic.etherscan.io/',
      logoLight: Logos.OpEtherscanLogoLight,
      logoDark: Logos.OpEtherscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore/tokens/optimism',
    label: 'Optimism',
    logo: OPTIMISM_LOGO,
    nativeCurrency: {
      name: 'Optimistic ETH',
      symbol: 'ETH',
      decimals: 18,
      address: DEFAULT_NATIVE_ADDRESS,
      explorerLink: 'https://optimistic.etherscan.io/chart/etherprice',
    },
    wrappedNativeCurrency: {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000006',
    },
    rpcUrls: { [RPCType.PublicAlt]: 'https://mainnet.optimism.io' },
    statusPage: 'https://optimism.io/status',
  },
  [ChainId.Polygon]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://wallet.polygon.technology/bridge',
    docs: 'https://polygon.io/',
    explorer: {
      name: 'PolygonScan',
      url: 'https://polygonscan.com/',
      logoLight: Logos.PolygonscanLogoLight,
      logoDark: Logos.PolygonscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore/tokens/polygon',
    label: 'Polygon',
    logo: POLYGON_LOGO,
    nativeCurrency: {
      name: 'Polygon Matic',
      symbol: 'MATIC',
      decimals: 18,
      address: '0x0000000000000000000000000000000000001010',
    },
    wrappedNativeCurrency: {
      name: 'Wrapped MATIC',
      symbol: 'WMATIC',
      decimals: 18,
      address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    },
    rpcUrls: { [RPCType.PublicAlt]: 'https://polygon-rpc.com/' },
  },
  [ChainId.PolygonMumbai]: {
    blockWaitMsBeforeWarning: 600000, // 10 minutes
    bridge: 'https://wallet.polygon.technology/bridge',
    docs: 'https://polygon.io/',
    explorer: {
      name: 'PolygonScan',
      url: 'https://mumbai.polygonscan.com/',
      logoLight: Logos.PolygonscanLogoLight,
      logoDark: Logos.PolygonscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore/tokens/polygon',
    label: 'Polygon Mumbai',
    logo: MUMBAI_LOGO,
    nativeCurrency: {
      name: 'Polygon Mumbai Matic',
      symbol: 'mMATIC',
      decimals: 18,
      address: '0x0000000000000000000000000000000000001010',
    },
    wrappedNativeCurrency: {
      name: 'Wrapped MATIC',
      symbol: 'WMATIC',
      decimals: 18,
      address: '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
    },
    rpcUrls: { [RPCType.PublicAlt]: 'https://rpc-endpoints.superfluid.dev/mumbai' },
  },
  [ChainId.Blast]: {
    blockWaitMsBeforeWarning: 600000,
    bridge: 'https://blast.io/en/bridge/',
    docs: 'https://docs.blast.io/about-blast/',
    explorer: {
      name: 'BlastScan',
      url: 'https://blastscan.io/',
      logoLight: Logos.EtherscanLogoLight,
      logoDark: Logos.EtherscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore/tokens/blast',
    label: 'Blast',
    logo: BLAST_LOGO,
    nativeCurrency: {
      name: 'Blast ETH',
      symbol: 'ETH',
      decimals: 18,
      address: DEFAULT_NATIVE_ADDRESS,
    },
    wrappedNativeCurrency: {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0x4300000000000000000000000000000000000004',
    },
    rpcUrls: { [RPCType.Public]: 'https://rpc.blast.io' },
  },
  [ChainId.Zora]: {
    blockWaitMsBeforeWarning: 600000,
    bridge: 'https://bridge.zora.energy/',
    docs: 'https://docs.zora.co/',
    explorer: {
      name: 'Zora explorer',
      url: 'https://explorer.zora.energy/',
      logoLight: Logos.EtherscanLogoLight,
      logoDark: Logos.EtherscanLogoDark,
    },
    infoLink: 'https://app.uniswap.org/explore/tokens/zora?chain=zora',
    label: 'Zora',
    logo: ZORA_LOGO,
    nativeCurrency: {
      name: 'Zora ETH',
      symbol: 'ETH',
      decimals: 18,
      address: DEFAULT_NATIVE_ADDRESS,
    },
    wrappedNativeCurrency: {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0x4200000000000000000000000000000000000006',
    },
    rpcUrls: { [RPCType.Public]: 'https://rpc.zora.energy/' },
  },
}
