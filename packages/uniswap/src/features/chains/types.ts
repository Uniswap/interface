// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { CurrencyAmount, Token, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import type { GraphQLApi } from '@universe/api'
import type { ImageSourcePropType } from 'react-native'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { type UNIVERSE_CHAIN_INFO } from 'uniswap/src/features/chains/chainInfo'
import { SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { NonEmptyArray } from 'utilities/src/primitives/array'
import { Chain as WagmiChain } from 'wagmi/chains'

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
  Solana = 501000101,
}

export type UniverseChainIdByPlatform<T extends Platform> = ((typeof UNIVERSE_CHAIN_INFO)[UniverseChainId] & {
  platform: T
})['id']
export type EVMUniverseChainId = UniverseChainIdByPlatform<Platform.EVM>
export type SVMUniverseChainId = UniverseChainIdByPlatform<Platform.SVM>

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
  medWait: number
  maxWait: number
}

export type GqlChainId = Exclude<GraphQLApi.Chain, GraphQLApi.Chain.UnknownChain | GraphQLApi.Chain.EthereumGoerli>

export interface BackendChain {
  chain: GqlChainId
  /**
   * Set to false if the chain is not available on Explore.
   */
  backendSupported: boolean
  /**
   * Used for spot token prices
   */
  nativeTokenBackendAddress: string | undefined
}

type ChainRPCUrls = { http: string[] }
export interface UniverseChainInfo extends WagmiChain {
  readonly id: UniverseChainId
  readonly platform: Platform
  readonly assetRepoNetworkName: string | undefined // Name used to index the network on this repo: https://github.com/Uniswap/assets/
  readonly backendChain: BackendChain
  readonly blockPerMainnetEpochForChainId: number
  readonly blockWaitMsBeforeWarning: number | undefined
  readonly bridge?: string
  readonly docs: string
  readonly elementName: ElementName
  readonly explorer: {
    name: string
    url: `${string}/`
    apiURL?: string
  }
  readonly openseaName?: string
  readonly rpcUrls: {
    [RPCType.Default]: ChainRPCUrls
    [RPCType.Private]?: ChainRPCUrls
    [RPCType.Public]?: ChainRPCUrls
    [RPCType.PublicAlt]?: ChainRPCUrls
    [RPCType.Interface]: ChainRPCUrls
    [RPCType.Fallback]?: ChainRPCUrls
  }
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
  /** Override the default spot price stablecoin amount, e.g. for chains with low liquidity. */
  readonly spotPriceStablecoinAmountOverride?: CurrencyAmount<Token>
  readonly tokens: {
    /** An array of stablecoins for this chain -- the first item in the array is treated as a 'default' stablecoin for this chain. */
    stablecoins: NonEmptyArray<Token>
    USDC?: Token
    DAI?: Token
    USDT?: Token
  }
  readonly statusPage?: string
  readonly subblockTimeMs?: number // in milliseconds, used for subblock balance checks
  readonly supportsV4: boolean
  readonly urlParam: string
  readonly wrappedNativeCurrency: {
    name: string // 'Wrapped Ether',
    symbol: string // 'WETH',
    decimals: number // 18,
    address: string // '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'
  }
  readonly gasConfig: {
    send: {
      configKey: SwapConfigKey // Dynamic config key for send transactions
      default: number // Default gas amount in 10^-4 units relative to chain's native decimals
    }
    swap: {
      configKey: SwapConfigKey // Dynamic config key for swap transactions
      default: number // Default gas amount in 10^-4 units relative to chain's native decimals
    }
  }
  readonly tradingApiPollingIntervalMs: number
}
