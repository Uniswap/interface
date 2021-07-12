import arbitrumLogoUrl from 'assets/svg/arbitrum_logo.svg'
import optimismLogoUrl from 'assets/svg/optimism_logo.svg'

export enum SupportedChainId {
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

export type SupportedL2ChainId =
  | SupportedChainId.ARBITRUM_ONE
  | SupportedChainId.ARBITRUM_RINKEBY
  | SupportedChainId.OPTIMISM
  | SupportedChainId.OPTIMISTIC_KOVAN

export type SupportedL1ChainId =
  | SupportedChainId.MAINNET
  | SupportedChainId.ROPSTEN
  | SupportedChainId.RINKEBY
  | SupportedChainId.GOERLI
  | SupportedChainId.KOVAN

export const NETWORK_LABELS: { [chainId in SupportedChainId | number]: string } = {
  [SupportedChainId.MAINNET]: 'Mainnet',
  [SupportedChainId.RINKEBY]: 'Rinkeby',
  [SupportedChainId.ROPSTEN]: 'Ropsten',
  [SupportedChainId.GOERLI]: 'Görli',
  [SupportedChainId.KOVAN]: 'Kovan',
  [SupportedChainId.ARBITRUM_ONE]: 'Arbitrum',
  [SupportedChainId.ARBITRUM_RINKEBY]: 'Arbitrum Rinkeby',
  [SupportedChainId.OPTIMISM]: 'Optimistic Ethereum',
  [SupportedChainId.OPTIMISTIC_KOVAN]: 'Optimistic Kovan',
} as const

export const L1_CHAIN_IDS = [
  SupportedChainId.MAINNET,
  SupportedChainId.ROPSTEN,
  SupportedChainId.RINKEBY,
  SupportedChainId.GOERLI,
  SupportedChainId.KOVAN,
]

export const L2_CHAIN_IDS = [
  SupportedChainId.ARBITRUM_ONE,
  SupportedChainId.ARBITRUM_RINKEBY,
  SupportedChainId.OPTIMISM,
  SupportedChainId.OPTIMISTIC_KOVAN,
]
interface L1ChainInfo {
  docs: string
  explorer: string
  infoLink: string
  label: string
}
interface L2ChainInfo extends L1ChainInfo {
  bridge: string
  logoUrl: string
}

type ChainInfo = { [chainId in SupportedL2ChainId]: L2ChainInfo } &
  { [chainId in SupportedL1ChainId]: L1ChainInfo } & { [chainId: number]: L1ChainInfo | L2ChainInfo }

export const CHAIN_INFO: ChainInfo = {
  [SupportedChainId.ARBITRUM_ONE]: {
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://explorer.arbitrum.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: NETWORK_LABELS[SupportedChainId.ARBITRUM_ONE],
    logoUrl: arbitrumLogoUrl,
  },
  [SupportedChainId.ARBITRUM_RINKEBY]: {
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://explorer.arbitrum.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: NETWORK_LABELS[SupportedChainId.ARBITRUM_RINKEBY],
    logoUrl: arbitrumLogoUrl,
  },
  [SupportedChainId.MAINNET]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedChainId.MAINNET],
  },
  [SupportedChainId.RINKEBY]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://rinkeby.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedChainId.RINKEBY],
  },
  [SupportedChainId.ROPSTEN]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://ropsten.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedChainId.ROPSTEN],
  },
  [SupportedChainId.KOVAN]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://kovan.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedChainId.KOVAN],
  },
  [SupportedChainId.GOERLI]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://goerli.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedChainId.GOERLI],
  },
  [SupportedChainId.OPTIMISM]: {
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: NETWORK_LABELS[SupportedChainId.OPTIMISM],
    logoUrl: optimismLogoUrl,
  },
  [SupportedChainId.OPTIMISTIC_KOVAN]: {
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: NETWORK_LABELS[SupportedChainId.OPTIMISTIC_KOVAN],
    logoUrl: optimismLogoUrl,
  },
}
