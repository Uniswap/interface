import { CHAIN_INFO, ChainId } from './chains'

const MATIC_MAINNET_ADDRESS = '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
const MATIC_BNB_ADDRESS = '0xcc42724c6683b7e57334c4e856f4c9965ed682bd'
const MATIC_ARBITRUM_ADDRESS = '0x561877b6b3dd7651313794e5f2894b2f18be0766'
const BNB_MAINNET_ADDRESS = '0xb8c77482e45f1f44de1745f52c74426c631bdd52'
const BNB_POLYGON_ADDRESS = '0x3ba4c387f786bfee076a58914f5bd38d668b42c3'
const BNB_ARBITRUM_ADDRESS = '0x20865e63b111b2649ef829ec220536c82c58ad7b'

export const BRIDGED_BASE_ADDRESSES = [
  MATIC_MAINNET_ADDRESS,
  MATIC_BNB_ADDRESS,
  MATIC_ARBITRUM_ADDRESS,
  BNB_MAINNET_ADDRESS,
  BNB_POLYGON_ADDRESS,
  BNB_ARBITRUM_ADDRESS,
]

export function getNativeAddress(chainId: ChainId): string {
  return CHAIN_INFO[chainId].nativeCurrency.address
}

export function getWrappedNativeAddress(chainId: ChainId): string {
  return CHAIN_INFO[chainId].wrappedNativeCurrency.address
}

export const UNI_ADDRESS = {
  [ChainId.Mainnet]: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  [ChainId.Goerli]: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
}
