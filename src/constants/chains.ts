import { ChainId } from '@fuseio/fuse-swap-sdk'
import { BINANCE_MAINNET_CHAINID } from './index'

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

export const BSC_CHAIN: Chain = {
  chainId: '0x38',
  chainName: 'Smart Chain',
  nativeCurrency: {
    name: 'Binance',
    symbol: 'BNB',
    decimals: 18
  },
  rpc: 'https://bsc-dataseed.binance.org',
  explorer: 'https://bscscan.com'
}

export const CHAIN_MAP: { [key: number]: Chain } = {
  [ChainId.FUSE]: FUSE_CHAIN,
  [BINANCE_MAINNET_CHAINID]: BSC_CHAIN
}
