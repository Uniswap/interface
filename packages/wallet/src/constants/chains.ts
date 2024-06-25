// Based on https://github.com/Uniswap/interface/blob/main/src/constants/chains.ts
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { ChainId, UniverseChainId, UniverseChainInfo } from 'uniswap/src/types/chains'

export const ALL_SUPPORTED_CHAINS: string[] = Object.values(ChainId).map((c) => c.toString())

// DON'T CHANGE - order here determines ordering of networks in app
// TODO: [MOB-250] Add back in testnets once our endpoints support them
export const ALL_SUPPORTED_CHAIN_IDS: ChainId[] = [
  ChainId.Mainnet,
  ChainId.Polygon,
  ChainId.ArbitrumOne,
  ChainId.Optimism,
  ChainId.Base,
  ChainId.Bnb,
  ChainId.Blast,
  ChainId.Avalanche,
  ChainId.Celo,
  ChainId.Zora,
  ChainId.Taraxa,
]

export const TESTNET_CHAIN_IDS = [ChainId.Goerli, ChainId.PolygonMumbai, ChainId.TaraxaTestnet]

export const ETHEREUM_CHAIN_IDS = [
  ChainId.Mainnet,
  ChainId.Goerli,
  ChainId.Taraxa,
  ChainId.TaraxaTestnet,
] as const

// Renamed from SupportedL1ChainId in web app
export type EthereumChainId = (typeof ETHEREUM_CHAIN_IDS)[number]

export const L2_CHAIN_IDS = [
  ChainId.ArbitrumOne,
  ChainId.Avalanche,
  ChainId.Base,
  ChainId.Celo,
  ChainId.Optimism,
  ChainId.Polygon,
  ChainId.PolygonMumbai,
  ChainId.Bnb,
  ChainId.Blast,
  ChainId.Zora,
] as const

// Renamed from SupportedL2ChainId in web app
export type L2ChainId = (typeof L2_CHAIN_IDS)[number]

export type L1ChainInfo = UniverseChainInfo
export interface L2ChainInfo extends L1ChainInfo {
  readonly bridge: string
  readonly statusPage?: string
}

export type ChainInfo = {
  readonly [chainId in L2ChainId]: L2ChainInfo
} & { readonly [chainId in EthereumChainId]: L1ChainInfo }

export const CHAIN_INFO: ChainInfo = {
  [UniverseChainId.Mainnet]: UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet],
  [UniverseChainId.ArbitrumOne]: UNIVERSE_CHAIN_INFO[
    UniverseChainId.ArbitrumOne
  ] satisfies L2ChainInfo,
  [UniverseChainId.Goerli]: UNIVERSE_CHAIN_INFO[UniverseChainId.Goerli],
  [UniverseChainId.Optimism]: UNIVERSE_CHAIN_INFO[UniverseChainId.Optimism] satisfies L2ChainInfo,
  [UniverseChainId.Base]: UNIVERSE_CHAIN_INFO[UniverseChainId.Base] satisfies L2ChainInfo,
  [UniverseChainId.BNB]: UNIVERSE_CHAIN_INFO[UniverseChainId.BNB] satisfies L2ChainInfo,
  [UniverseChainId.Polygon]: UNIVERSE_CHAIN_INFO[UniverseChainId.Polygon] satisfies L2ChainInfo,
  [UniverseChainId.PolygonMumbai]: UNIVERSE_CHAIN_INFO[
    UniverseChainId.PolygonMumbai
  ] satisfies L2ChainInfo,
  [UniverseChainId.Blast]: UNIVERSE_CHAIN_INFO[UniverseChainId.Blast] satisfies L2ChainInfo,
  [UniverseChainId.Zora]: UNIVERSE_CHAIN_INFO[UniverseChainId.Zora] satisfies L2ChainInfo,
  [UniverseChainId.Avalanche]: UNIVERSE_CHAIN_INFO[UniverseChainId.Avalanche] satisfies L2ChainInfo,
  [UniverseChainId.Celo]: UNIVERSE_CHAIN_INFO[UniverseChainId.Celo] satisfies L2ChainInfo,
  [UniverseChainId.TaraxaTestnet]: UNIVERSE_CHAIN_INFO[UniverseChainId.TaraxaTestnet],
  [UniverseChainId.Taraxa]: UNIVERSE_CHAIN_INFO[UniverseChainId.TARAXA],
}
