export interface Chain {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpc: string
  explorer?: string
}

export const FUSE_CHAIN: Chain = {
  chainId: '0x7a',
  chainName: 'Fuse Network',
  nativeCurrency: {
    name: 'Fuse',
    symbol: 'FUSE',
    decimals: 18
  },
  rpc: 'https://rpc.fuse.io',
  explorer: 'https://explorer.fuse.io'
}
