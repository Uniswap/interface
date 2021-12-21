import xdcLogoUrl from 'assets/wallets/xdc-logo.png'

export enum SupportedChainId {
  MAINNET = 50,
  TESTNET = 51,
}

export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = [SupportedChainId.MAINNET, SupportedChainId.TESTNET]

export const L1_CHAIN_IDS = [SupportedChainId.MAINNET, SupportedChainId.TESTNET] as const

export type SupportedL1ChainId = typeof L1_CHAIN_IDS[number]

export interface L1ChainInfo {
  readonly blockWaitMsBeforeWarning?: number
  readonly docs: string
  readonly explorer: string
  readonly infoLink: string
  readonly label: string
  readonly logoUrl?: string
  readonly rpcUrls?: string[]
  readonly nativeCurrency: {
    name: string // 'Goerli ETH',
    symbol: string // 'gorETH',
    decimals: number //18,
  }
}

export type ChainInfo = { readonly [chainId: number]: L1ChainInfo } & {
  readonly [chainId in SupportedL1ChainId]: L1ChainInfo
}

export const CHAIN_INFO: ChainInfo = {
  [SupportedChainId.MAINNET]: {
    docs: 'https://howto.xinfin.org/',
    explorer: 'https://explorer.xinfin.network/',
    infoLink: 'https://xinfin.network/',
    label: 'XinFin Network',
    logoUrl: xdcLogoUrl,
    nativeCurrency: {
      name: 'XDC',
      symbol: 'XDC',
      decimals: 18,
    },
  },
  [SupportedChainId.TESTNET]: {
    docs: 'https://howto.xinfin.org/',
    explorer: 'https://explorer.apothem.network',
    infoLink: 'https://xinfin.network/',
    label: 'XinFin Testnet',
    logoUrl: xdcLogoUrl,
    nativeCurrency: {
      name: 'TXDC',
      symbol: 'TXDC',
      decimals: 18,
    },
  },
}
