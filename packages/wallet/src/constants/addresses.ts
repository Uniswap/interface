// Copied from https://github.com/Uniswap/interface/blob/main/src/constants/addresses.ts
import { ChainId } from './chains'

/** Address that represents native currencies on ETH, Polygon, etc. */
export const NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

export const MATIC_MAINNET_ADDRESS = '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
export const BNB_MAINNET_ADDRESS = '0xb8c77482e45f1f44de1745f52c74426c631bdd52'
export const MATIC_BNB_ADDRESS = '0xcc42724c6683b7e57334c4e856f4c9965ed682bd'

/** Alternative address used to denote a native currency (e.g. MATIC on Polygon) */
export const NATIVE_ADDRESS_ALT = '0x0000000000000000000000000000000000001010'

export const WRAPPED_MAINNET_ETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
export const WRAPPED_GOERLI_ETH = '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'
export const WRAPPED_OPTIMISTIC_ETH = '0x4200000000000000000000000000000000000006'
export const WRAPPED_ARBITRUM_ETH = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
export const WRAPPED_BASE_ETH = '0x4200000000000000000000000000000000000006'
export const WRAPPED_MAINNET_POLYGON = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
export const WRAPPED_MUMBAI_POLYGON = '0x9c3c9283d3e44854697cd22d3faa240cfb032889'
export const WRAPPED_BNB = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'

export const UNI_ADDRESS = {
  [ChainId.Mainnet]: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  [ChainId.Goerli]: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
}
