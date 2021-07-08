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

export const L2_CHAIN_IDS = [SupportedChainId.ARBITRUM_ONE, SupportedChainId.OPTIMISM]

export const L2_INFO: Record<number, { bridge: string; docs: string; explorer: string; logoUrl: string }> = {
  [SupportedChainId.OPTIMISM]: {
    bridge: 'https://gateway.optimism.io/',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    logoUrl: optimismLogoUrl,
  },
  [SupportedChainId.ARBITRUM_ONE]: {
    bridge: 'https://bridge.arbitrum.io/',
    explorer: 'https://explorer.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    logoUrl: arbitrumLogoUrl,
  },
}

export const NETWORK_LABELS: { [chainId in SupportedChainId | number]: string } = {
  [SupportedChainId.MAINNET]: 'Mainnet',
  [SupportedChainId.RINKEBY]: 'Rinkeby',
  [SupportedChainId.ROPSTEN]: 'Ropsten',
  [SupportedChainId.GOERLI]: 'Görli',
  [SupportedChainId.KOVAN]: 'Kovan',
  [SupportedChainId.ARBITRUM_ONE]: 'Arbitrum',
  [SupportedChainId.ARBITRUM_RINKEBY]: 'Arbitrum Testnet',
  [SupportedChainId.OPTIMISM]: 'Optimism',
  [SupportedChainId.OPTIMISTIC_KOVAN]: 'Optimism Testnet',
}
