import { CurrencyAmount, Token, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
// eslint-disable-next-line no-restricted-imports
import type { ImageSourcePropType } from 'react-native'
import { GeneratedIcon } from 'ui/src'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { Chain as WagmiChain } from 'wagmi/chains'

export enum UniverseChainId {
  Mainnet = UniswapSDKChainId.MAINNET,
  Sepolia = UniswapSDKChainId.SEPOLIA,
  Optimism = UniswapSDKChainId.OPTIMISM,
  ArbitrumOne = UniswapSDKChainId.ARBITRUM_ONE,
  Polygon = UniswapSDKChainId.POLYGON,
  Avalanche = UniswapSDKChainId.AVALANCHE,
  Celo = UniswapSDKChainId.CELO,
  Bnb = UniswapSDKChainId.BNB,
  Base = UniswapSDKChainId.BASE,
  Blast = UniswapSDKChainId.BLAST,
  WorldChain = UniswapSDKChainId.WORLDCHAIN,
  Zora = UniswapSDKChainId.ZORA,
  Zksync = UniswapSDKChainId.ZKSYNC,
  AstrochainSepolia = UniswapSDKChainId.ASTROCHAIN_SEPOLIA,
}

// DON'T CHANGE - order here determines ordering of networks in app
export const SUPPORTED_CHAIN_IDS: UniverseChainId[] = [
  UniverseChainId.Mainnet,
  UniverseChainId.Polygon,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Optimism,
  UniverseChainId.Base,
  UniverseChainId.Bnb,
  UniverseChainId.Blast,
  UniverseChainId.Avalanche,
  UniverseChainId.Celo,
  UniverseChainId.WorldChain,
  UniverseChainId.Zora,
  UniverseChainId.Zksync,
]

export const SUPPORTED_TESTNET_CHAIN_IDS: UniverseChainId[] = [UniverseChainId.Sepolia, UniverseChainId.AstrochainSepolia]

export const COMBINED_CHAIN_IDS: UniverseChainId[] = [...SUPPORTED_CHAIN_IDS, ...SUPPORTED_TESTNET_CHAIN_IDS]

export enum RPCType {
  Public = 'public',
  Private = 'private',
  PublicAlt = 'public_alternative',
}

export enum NetworkLayer {
  L1,
  L2,
}

export interface RetryOptions {
  n: number
  minWait: number
  maxWait: number
}

export type InterfaceGqlChain = Exclude<BackendChainId, BackendChainId.UnknownChain| BackendChainId.EthereumGoerli>

export interface BackendChain {
  chain: InterfaceGqlChain
  /**
   * Set to false if the chain is not available on Explore.
   */
  backendSupported: boolean
  /**
   * Set to true if the chain does not have a specific GQLChain. Eg: Optimism-Goerli.
   */
  isSecondaryChain: boolean
  /**
   * Used for spot token prices
   */
  nativeTokenBackendAddress: string | undefined
}

export interface UniverseChainInfo extends WagmiChain {
  readonly id: UniverseChainId
  readonly sdkId: UniswapSDKChainId
  readonly assetRepoNetworkName: string | undefined // Name used to index the network on this repo: https://github.com/Uniswap/assets/
  readonly backendChain: BackendChain
  readonly blockPerMainnetEpochForChainId: number
  readonly blockWaitMsBeforeWarning: number | undefined
  readonly bridge?: string
  readonly chainPriority: number // Higher priority chains show up first in the chain selector
  readonly docs: string
  readonly elementName: ElementNameType
  readonly explorer: {
    name: string
    url: string
    apiURL?: string
  }
  readonly helpCenterUrl: string | undefined
  readonly infoLink: string
  readonly infuraPrefix: string | undefined
  readonly interfaceName: string
  readonly label: string
  readonly logo?: ImageSourcePropType
  readonly nativeCurrency: {
    name: string // 'Goerli ETH',
    symbol: string // 'gorETH',
    decimals: number // 18,
    address: string // '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    explorerLink?: string // Special override for native ETH explorer link
    logo: ImageSourcePropType
  }
  readonly networkLayer: NetworkLayer
  readonly pendingTransactionsRetryOptions: RetryOptions | undefined
  readonly spotPriceStablecoinAmount: CurrencyAmount<Token>
  readonly stablecoins: Token[]
  readonly statusPage?: string
  readonly supportsClientSideRouting: boolean
  readonly supportsGasEstimates: boolean
  readonly urlParam: string
  readonly wrappedNativeCurrency: {
    name: string // 'Wrapped Ether',
    symbol: string // 'WETH',
    decimals: number // 18,
    address: string // '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'
  }
}

export interface UniverseChainLogoInfo {
  explorer: {
    logoLight: GeneratedIcon
    logoDark: GeneratedIcon
  }
}
