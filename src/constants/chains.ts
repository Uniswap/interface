import arbitrumLogoUrl from 'assets/svg/arbitrum_logo.svg'
import optimismLogoUrl from 'assets/svg/optimism_logo.svg'

export enum SupportedL2ChainId {
  ARBITRUM_ONE = 42161,
  ARBITRUM_RINKEBY = 421611,
  OPTIMISM = 10,
  OPTIMISTIC_KOVAN = 69,
}

export enum SupportedL1ChainId {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GOERLI = 5,
  KOVAN = 42,
}
export const SupportedChainId = {
  ...SupportedL1ChainId,
  ...SupportedL2ChainId,
}

export const NETWORK_LABELS: { [chainId in (SupportedL1ChainId & SupportedL2ChainId) | number]: string } = {
  [SupportedL1ChainId.MAINNET]: 'Mainnet',
  [SupportedL1ChainId.RINKEBY]: 'Rinkeby',
  [SupportedL1ChainId.ROPSTEN]: 'Ropsten',
  [SupportedL1ChainId.GOERLI]: 'Görli',
  [SupportedL1ChainId.KOVAN]: 'Kovan',
  [SupportedL2ChainId.ARBITRUM_ONE]: 'Arbitrum',
  [SupportedL2ChainId.ARBITRUM_RINKEBY]: 'Arbitrum Rinkeby',
  [SupportedL2ChainId.OPTIMISM]: 'Optimistic Ethereum',
  [SupportedL2ChainId.OPTIMISTIC_KOVAN]: 'Optimistic Kovan',
}

export const L2_CHAIN_IDS = [
  SupportedL2ChainId.ARBITRUM_ONE,
  SupportedL2ChainId.ARBITRUM_RINKEBY,
  SupportedL2ChainId.OPTIMISM,
  SupportedL2ChainId.OPTIMISTIC_KOVAN,
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
  [SupportedL2ChainId.ARBITRUM_ONE]: {
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://explorer.arbitrum.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: NETWORK_LABELS[SupportedL2ChainId.ARBITRUM_ONE],
    logoUrl: arbitrumLogoUrl,
  },
  [SupportedL2ChainId.ARBITRUM_RINKEBY]: {
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://explorer.arbitrum.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: NETWORK_LABELS[SupportedL2ChainId.ARBITRUM_RINKEBY],
    logoUrl: arbitrumLogoUrl,
  },
  [SupportedL1ChainId.MAINNET]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedL1ChainId.MAINNET],
  },
  [SupportedL1ChainId.RINKEBY]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://rinkeby.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedL1ChainId.RINKEBY],
  },
  [SupportedL1ChainId.ROPSTEN]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://ropsten.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedL1ChainId.ROPSTEN],
  },
  [SupportedL1ChainId.KOVAN]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://kovan.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedL1ChainId.KOVAN],
  },
  [SupportedL1ChainId.GOERLI]: {
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://goerli.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: NETWORK_LABELS[SupportedL1ChainId.GOERLI],
  },
  [SupportedL2ChainId.OPTIMISM]: {
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: NETWORK_LABELS[SupportedL2ChainId.OPTIMISM],
    logoUrl: optimismLogoUrl,
  },
  [SupportedL2ChainId.OPTIMISTIC_KOVAN]: {
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism',
    label: NETWORK_LABELS[SupportedL2ChainId.OPTIMISTIC_KOVAN],
    logoUrl: optimismLogoUrl,
  },
}
