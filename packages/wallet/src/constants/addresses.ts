import { ChainId } from './chains'

/** Address that represents native currencies on ETH, Arbitrum, etc. */
export const NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
/** Alternative address used to denote a native currency (e.g. MATIC on Polygon) */
export const NATIVE_ADDRESS_ALT = '0x0000000000000000000000000000000000001010'

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

export const WRAPPED_BASE_ADDRESSES: { [key in ChainId]: string } = {
  [ChainId.Mainnet]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  [ChainId.Goerli]: '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6',
  [ChainId.Polygon]: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  [ChainId.PolygonMumbai]: '0x9c3c9283d3e44854697cd22d3faa240cfb032889',
  [ChainId.ArbitrumOne]: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  [ChainId.Optimism]: '0x4200000000000000000000000000000000000006',
  [ChainId.Base]: '0x4200000000000000000000000000000000000006',
  [ChainId.Bnb]: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
}

export const UNI_ADDRESS = {
  [ChainId.Mainnet]: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  [ChainId.Goerli]: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
}
