// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CurrencyAmount, Token, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import type { ImageSourcePropType } from 'react-native'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { Chain as WagmiChain } from 'wagmi/chains'

export function isUniverseChainId(chainId?: number | UniverseChainId | null): chainId is UniverseChainId {
  return !!chainId && ALL_CHAIN_IDS.includes(chainId as UniverseChainId)
}

export enum UniverseChainId {
  Mainnet = UniswapSDKChainId.MAINNET,
  ArbitrumOne = UniswapSDKChainId.ARBITRUM_ONE,
  Avalanche = UniswapSDKChainId.AVALANCHE,
  Base = UniswapSDKChainId.BASE,
  Blast = UniswapSDKChainId.BLAST,
  Bnb = UniswapSDKChainId.BNB,
  Celo = UniswapSDKChainId.CELO,
  MonadTestnet = UniswapSDKChainId.MONAD_TESTNET,
  Optimism = UniswapSDKChainId.OPTIMISM,
  Polygon = UniswapSDKChainId.POLYGON,
  Sepolia = UniswapSDKChainId.SEPOLIA,
  Soneium = UniswapSDKChainId.SONEIUM,
  Unichain = UniswapSDKChainId.UNICHAIN,
  UnichainSepolia = UniswapSDKChainId.UNICHAIN_SEPOLIA,
  WorldChain = UniswapSDKChainId.WORLDCHAIN,
  Zksync = UniswapSDKChainId.ZKSYNC,
  Zora = UniswapSDKChainId.ZORA,
}

export const SUPPORTED_CHAIN_IDS: UniverseChainId[] = [
  UniverseChainId.Mainnet,
  UniverseChainId.Unichain,
  UniverseChainId.Polygon,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Optimism,
  UniverseChainId.Base,
  UniverseChainId.Bnb,
  UniverseChainId.Blast,
  UniverseChainId.Avalanche,
  UniverseChainId.Celo,
  UniverseChainId.WorldChain,
  UniverseChainId.Soneium,
  UniverseChainId.Zora,
  UniverseChainId.Zksync,
]

export const SUPPORTED_TESTNET_CHAIN_IDS: UniverseChainId[] = [
  UniverseChainId.Sepolia,
  UniverseChainId.UnichainSepolia,
  UniverseChainId.MonadTestnet,
]

// This order is used as a fallback for chain ordering but will otherwise defer to useOrderedChainIds
export const ALL_CHAIN_IDS: UniverseChainId[] = [...SUPPORTED_CHAIN_IDS, ...SUPPORTED_TESTNET_CHAIN_IDS]

export interface EnabledChainsInfo {
  chains: UniverseChainId[]
  gqlChains: GqlChainId[]
  defaultChainId: UniverseChainId
  isTestnetModeEnabled: boolean
}

export enum RPCType {
  Public = 'public',
  Private = 'private',
  PublicAlt = 'public_alternative',
  Interface = 'interface',
  Fallback = 'fallback',
  Default = 'default',
}

export enum NetworkLayer {
  L1 = 0,
  L2 = 1,
}

export interface RetryOptions {
  n: number
  minWait: number
  maxWait: number
}

export type GqlChainId = Exclude<BackendChainId, BackendChainId.UnknownChain | BackendChainId.EthereumGoerli>

export interface BackendChain {
  chain: GqlChainId
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

type ChainRPCUrls = { http: string[] }
export interface UniverseChainInfo extends WagmiChain {
  readonly id: UniverseChainId
  readonly sdkId: UniswapSDKChainId
  readonly assetRepoNetworkName: string | undefined // Name used to index the network on this repo: https://github.com/Uniswap/assets/
  readonly backendChain: BackendChain
  readonly blockPerMainnetEpochForChainId: number
  readonly blockWaitMsBeforeWarning: number | undefined
  readonly bridge?: string
  readonly docs: string
  readonly elementName: ElementNameType
  readonly explorer: {
    name: string
    url: `${string}/`
    apiURL?: string
  }
  readonly rpcUrls: {
    [RPCType.Default]: ChainRPCUrls
    [RPCType.Private]?: ChainRPCUrls
    [RPCType.Public]?: ChainRPCUrls
    [RPCType.PublicAlt]?: ChainRPCUrls
    [RPCType.Interface]: ChainRPCUrls
    [RPCType.Fallback]?: ChainRPCUrls
  }
  readonly helpCenterUrl: string | undefined
  readonly infoLink: string
  readonly infuraPrefix: string | undefined
  readonly interfaceName: string
  readonly label: string
  readonly logo: ImageSourcePropType
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
  readonly supportsInterfaceClientSideRouting: boolean
  readonly supportsGasEstimates: boolean
  readonly supportsV4: boolean
  readonly urlParam: string
  readonly wrappedNativeCurrency: {
    name: string // 'Wrapped Ether',
    symbol: string // 'WETH',
    decimals: number // 18,
    address: string // '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'
  }
}
