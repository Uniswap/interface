// import { ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const POL_MAINNET_ADDRESS = '0x455e53cbb86018ac2b8092fdcd39d8444affc3f6'
const MATIC_MAINNET_ADDRESS = '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
const MATIC_BNB_ADDRESS = '0xcc42724c6683b7e57334c4e856f4c9965ed682bd'
const MATIC_ARBITRUM_ADDRESS = '0x561877b6b3dd7651313794e5f2894b2f18be0766'
const BNB_MAINNET_ADDRESS = '0xb8c77482e45f1f44de1745f52c74426c631bdd52'
const BNB_POLYGON_ADDRESS = '0x3ba4c387f786bfee076a58914f5bd38d668b42c3'
const BNB_ARBITRUM_ADDRESS = '0x20865e63b111b2649ef829ec220536c82c58ad7b'
const CELO_MAINNET_ADDRESS = '0x471ece3750da237f93b8e339c536989b8978a438'
const AVAX_BNB = '0x1ce0c2827e2ef14d5c4f29a091d735a204794041'
const MATIC_UNICHAIN_ADDRESS = '0xf6ac97b05b3bc92f829c7584b25839906507176b'

export const NATIVE_TOKEN_PLACEHOLDER = 'NATIVE'

export const BRIDGED_BASE_ADDRESSES = [
  POL_MAINNET_ADDRESS,
  MATIC_MAINNET_ADDRESS,
  MATIC_BNB_ADDRESS,
  MATIC_ARBITRUM_ADDRESS,
  BNB_MAINNET_ADDRESS,
  BNB_POLYGON_ADDRESS,
  BNB_ARBITRUM_ADDRESS,
  CELO_MAINNET_ADDRESS,
  AVAX_BNB,
  MATIC_UNICHAIN_ADDRESS,
]

export function getNativeAddress(chainId: UniverseChainId): string {
  return getChainInfo(chainId).nativeCurrency.address
}

export function getWrappedNativeAddress(chainId: UniverseChainId): string {
  return getChainInfo(chainId).wrappedNativeCurrency.address
}

export function getFewETHWrapperAddress(chainId: UniverseChainId): string {
  const addresses: Partial<Record<UniverseChainId | number, string>> = {
    [UniverseChainId.Sepolia]: '0xC8D2bBBfDf6CED270d82aEa5961fE28608490F9f',
    // [UniswapSDKChainId.BLAST_SEPOLIA]: '0xCd31E6C1AD4c9E0E7F6A1f44583C038eaAaCf53F',
    [UniverseChainId.Blast]: '0xF272a4b0d949011f9347134088126277abeB065F',
    [UniverseChainId.Mainnet]: '0xAda6059b4F6244Acd8934095Ed0162C5Df6B5ebB',
    // [UniswapSDKChainId.ARBITRUM_SEPOLIA]: '0x295D7CF11f6667C359563A7FFAC54106DD6f114b',
    [UniverseChainId.Base]: '0x20E6B1260d12910C0Ab13c1AbEBCFe24AE9c4fe7',
    [UniverseChainId.ArbitrumOne]: '0xEeE400Eabfba8F60f4e6B351D8577394BeB972CD',
    // [UniswapSDKChainId.STORY_ODYSSEY]: '0xd7413358bFE4Aa5D707CcF8Ae7B4FF58E79e149A',
    // [UniswapSDKChainId.STORY_MAINNET]: '0xc43a3Dd1b16168e00297315d679840e30A89df42',
    [UniverseChainId.Unichain]: '0xc43a3Dd1b16168e00297315d679840e30A89df42',
    [UniverseChainId.Bnb]: '0xf9d7ff2f6A0c3631A807199276a493Af8097916F',
    // [UniswapSDKChainId.HYPER_MAINNET]: '0x068B60ECbC934b0a0dde20FdFf0dE925b97B971F',
    [UniverseChainId.MEGAETHMainnet]: '0xb0Bd0CD58551b71079F36B198276832242D02C0F',
  }

  const address = addresses[chainId]
  if (address) {
    return address
  }

  throw new Error(`FewETHWrapper address not found for chainId: ${chainId}`)
}

// TODO: Load this from config or backend once we have it (WALL-6592)
export const UNISWAP_DELEGATION_ADDRESS: Address = '0x227380efd3392EC33cf148Ade5e0a89D33121814'
