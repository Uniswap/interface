import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'

type AddressMap = { [chainId: number]: string }

const POL_MAINNET_ADDRESS = '0x455e53cbb86018ac2b8092fdcd39d8444affc3f6'
const MATIC_MAINNET_ADDRESS = '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
const MATIC_BNB_ADDRESS = '0xcc42724c6683b7e57334c4e856f4c9965ed682bd'
const MATIC_ARBITRUM_ADDRESS = '0x561877b6b3dd7651313794e5f2894b2f18be0766'
const BNB_MAINNET_ADDRESS = '0xb8c77482e45f1f44de1745f52c74426c631bdd52'
const BNB_POLYGON_ADDRESS = '0x3ba4c387f786bfee076a58914f5bd38d668b42c3'
const BNB_ARBITRUM_ADDRESS = '0x20865e63b111b2649ef829ec220536c82c58ad7b'
const CELO_MAINNET_ADDRESS = '0x471ece3750da237f93b8e339c536989b8978a438'
const AVAX_BNB = '0x1ce0c2827e2ef14d5c4f29a091d735a204794041'

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
]

export const GRG_ADDRESSES: AddressMap = {
  [UniverseChainId.Mainnet]: '0x4FbB350052Bca5417566f188eB2EBCE5b19BC964',
  // TODO: change Sepolia GRG
  [UniverseChainId.Sepolia]: '0x076C619e7ebaBe40746106B66bFBed731F2c1339',
  [UniverseChainId.ArbitrumOne]: '0x7F4638A58C0615037deCc86f1daE60E55fE92874',
  [UniverseChainId.Optimism]: '0xEcF46257ed31c329F204Eb43E254C609dee143B3',
  [UniverseChainId.Polygon]: '0xBC0BEA8E634ec838a2a45F8A43E7E16Cd2a8BA99',
  [UniverseChainId.Bnb]: '0x3d473C3eF4Cd4C909b020f48477a2EE2617A8e3C',
  [UniverseChainId.Base]: '0x09188484e1Ab980DAeF53a9755241D759C5B7d60',
}

export function getNativeAddress(chainId: UniverseChainId): string {
  return UNIVERSE_CHAIN_INFO[chainId].nativeCurrency.address
}

export function getWrappedNativeAddress(chainId: UniverseChainId): string {
  return UNIVERSE_CHAIN_INFO[chainId].wrappedNativeCurrency.address
}
