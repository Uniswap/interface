export enum ChainId {
  MAINNET = 1,
  SMARTBCH = 10000,
}

export const SUPPORTED_CHAINS = [ChainId.MAINNET, ChainId.SMARTBCH] as const
export type SupportedChainsType = (typeof SUPPORTED_CHAINS)[number]

export enum NativeCurrencyName {
  // Strings match input for CLI
  ETHER = 'ETH',
  MATIC = 'MATIC',
  CELO = 'CELO',
  GNOSIS = 'XDAI',
  MOONBEAM = 'GLMR',
  BNB = 'BNB',
  AVAX = 'AVAX',
  ROOTSTOCK = 'RBTC',
}
