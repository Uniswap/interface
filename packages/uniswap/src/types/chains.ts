import { CurrencyAmount, Token, ChainId as UniswapChainId } from '@taraswap/sdk-core'
// eslint-disable-next-line no-restricted-imports
import type { ImageSourcePropType } from 'react-native'
import { GeneratedIcon } from 'ui/src'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { Chain as WagmiChain } from 'wagmi/chains'

// Renamed from SupportedChainId in web app
export enum ChainId {
  Mainnet = 1,
  Goerli = 5,
  ArbitrumOne = 42161,
  Avalanche = 43114,
  Base = 8453,
  Celo = 42220,
  Optimism = 10,
  Polygon = 137,
  PolygonMumbai = 80001,
  Blast = 81457,
  Bnb = 56,
  Zora = 7777777,
  TaraxaTestnet = 842,
}

export const UniverseChainId = {
  ...ChainId,
  ...UniswapChainId,
}
export type UniverseChainId = ChainId | UniswapChainId

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

export type InterfaceGqlChain = Exclude<BackendChainId, BackendChainId.UnknownChain>

export interface BackendChain {
  chain: InterfaceGqlChain
  /**
   * Set to true if the chain is not available on Explore.
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
    logoLight: GeneratedIcon
    logoDark: GeneratedIcon
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
