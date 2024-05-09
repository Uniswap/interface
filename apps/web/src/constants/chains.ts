import { ChainId, Currency, CurrencyAmount, Token, V2_ROUTER_ADDRESSES } from '@uniswap/sdk-core'
import {
  CUSD_CELO,
  CUSD_CELO_ALFAJORES,
  DAI,
  DAI_ARBITRUM_ONE,
  DAI_OPTIMISM,
  DAI_POLYGON,
  MATIC_POLYGON,
  USDB_BLAST,
  USDC_ARBITRUM,
  USDC_ARBITRUM_GOERLI,
  USDC_AVALANCHE,
  USDC_BASE,
  USDC_BSC,
  USDC_CELO,
  USDC_GOERLI,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_OPTIMISM_GOERLI,
  USDC_POLYGON,
  USDC_POLYGON_MUMBAI,
  USDC_SEPOLIA,
  USDT,
  USDT_BSC,
  nativeOnChain,
} from 'constants/tokens'
import ms from 'ms'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { RetryOptions } from 'state/activity/polling/retry'
import { darkTheme } from 'theme/colors'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export const AVERAGE_L1_BLOCK_TIME = ms(`12s`)
export const DEFAULT_MS_BEFORE_WARNING = ms(`10m`)
const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 10, minWait: 250, maxWait: 1000 }

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
if (typeof INFURA_KEY === 'undefined') {
  throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
}
const QUICKNODE_MAINNET_RPC_URL = process.env.REACT_APP_QUICKNODE_MAINNET_RPC_URL
if (typeof QUICKNODE_MAINNET_RPC_URL === 'undefined') {
  throw new Error(`REACT_APP_QUICKNODE_MAINNET_RPC_URL must be a defined environment variable`)
}
const QUICKNODE_ARBITRUM_RPC_URL = process.env.REACT_APP_QUICKNODE_ARBITRUM_RPC_URL
if (typeof QUICKNODE_ARBITRUM_RPC_URL === 'undefined') {
  throw new Error(`REACT_APP_QUICKNODE_ARBITRUM_RPC_URL must be a defined environment variable`)
}
const QUICKNODE_BNB_RPC_URL = process.env.REACT_APP_BNB_RPC_URL
if (typeof QUICKNODE_BNB_RPC_URL === 'undefined') {
  throw new Error(`REACT_APP_BNB_RPC_URL must be a defined environment variable`)
}

export const SUPPORTED_INTERFACE_CHAIN_IDS = [
  ChainId.MAINNET,
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.BNB,
  ChainId.AVALANCHE,
  ChainId.BASE,
  ChainId.BLAST,
] as const

export type SupportedInterfaceChainId = (typeof SUPPORTED_INTERFACE_CHAIN_IDS)[number]

export function isSupportedChainId(chainId?: number | ChainId | null): chainId is SupportedInterfaceChainId {
  return !!chainId && SUPPORTED_INTERFACE_CHAIN_IDS.includes(chainId as SupportedInterfaceChainId)
}

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
// This is the reason why useSupportedChainId and useIsSupportedChainId is a hook instead of a function.
function useFeatureFlaggedChainIds(): Partial<Record<SupportedInterfaceChainId, boolean>> {
  // You can use the useFeatureFlag hook here to enable/disable chains based on feature flags.
  // Example: [ChainId.BLAST]: useFeatureFlag(FeatureFlags.BLAST)
  return {}
}

export function useIsSupportedChainId(chainId?: number | ChainId): chainId is SupportedInterfaceChainId {
  const featureFlaggedChains = useFeatureFlaggedChainIds()

  const chainIsNotEnabled = featureFlaggedChains[chainId as SupportedInterfaceChainId] === false
  return chainIsNotEnabled ? false : isSupportedChainId(chainId)
}

export function useIsSupportedChainIdCallback() {
  const featureFlaggedChains = useFeatureFlaggedChainIds()

  return useCallback(
    (chainId?: number | ChainId): chainId is SupportedInterfaceChainId => {
      const chainIsNotEnabled = featureFlaggedChains[chainId as SupportedInterfaceChainId] === false
      return chainIsNotEnabled ? false : isSupportedChainId(chainId)
    },
    [featureFlaggedChains]
  )
}

export function useSupportedChainId(chainId?: number): SupportedInterfaceChainId | undefined {
  const featureFlaggedChains = useFeatureFlaggedChainIds()
  if (!chainId || SUPPORTED_INTERFACE_CHAIN_IDS.indexOf(chainId) === -1) {
    return
  }

  const chainDisabled = featureFlaggedChains[chainId as SupportedInterfaceChainId] === false
  return chainDisabled ? undefined : (chainId as SupportedInterfaceChainId)
}

/**
 * TODO(WEB-4058): Move this into the new upcoming chain config
 * Can't move into the chain configs without the type becoming widened to just `string`, so keeping this list separate for now.
 */
const CHAIN_URL_PARAMS = [
  'arbitrum_goerli',
  'arbitrum',
  'avalanche',
  'base',
  'blast',
  'bnb',
  'celo_alfajores',
  'celo',
  'ethereum',
  'goerli',
  'optimism_goerli',
  'optimism',
  'polygon_mumbai',
  'polygon',
  'sepolia',
] as const
export type ChainSlug = (typeof CHAIN_URL_PARAMS)[number]
export const isChainUrlParam = (str?: string): str is ChainSlug => !!str && CHAIN_URL_PARAMS.includes(str as ChainSlug)
export const getChainUrlParam = (str?: string): ChainSlug | undefined => (isChainUrlParam(str) ? str : undefined)

export enum NetworkLayer {
  L1,
  L2,
}

export type InterfaceGqlChain = Exclude<Chain, Chain.UnknownChain>

interface BackendChain {
  chain: InterfaceGqlChain
  /**
   * Set to true if the chain is not available on Explore.
   */
  backendSupported: boolean
  /**
   * Set to true if the chain does not have a specific GQLChain. Eg: Optimism-Goerli.
   */
  isSecondaryChain?: true
  /**
   * Used for spot token prices
   */
  nativeTokenBackendAddress?: string
}

interface RPCUrls {
  /**
   * Public JSON-RPC endpoints.
   * These are used if the integrator does not provide an endpoint, or if the endpoint does not work.
   *
   * MetaMask allows switching to any URL, but displays a warning if it is not on the "Safe" list:
   * https://github.com/MetaMask/metamask-mobile/blob/bdb7f37c90e4fc923881a07fca38d4e77c73a579/app/core/RPCMethods/wallet_addEthereumChain.js#L228-L235
   * https://chainid.network/chains.json
   *
   * These "Safe" URLs are listed first, followed by other fallback URLs, which are taken from chainlist.org.
   */
  safe: string[]
  fallback?: string[]
  /**
   * Application-specific JSON-RPC endpoints.
   * These are URLs which may only be used by the interface, due to origin policies, &c.
   */
  appOnly: string[]
  infuraPrefix?: string
}

// TODO: https://linear.app/uniswap/issue/WEB-4058/chain-info-using-wagmi-chain-interface
// Add createChainInfo function that appropriately sets the default values for each chain
interface BaseChainInfo {
  readonly id: SupportedInterfaceChainId
  readonly name: string
  readonly urlParam: ChainSlug
  readonly blockWaitMsBeforeWarning?: number
  // Average block times were pulled from https://dune.com/jacobdcastro/avg-block-times on 2024-03-14,
  // and corroborated with that chain's documentation/explorer.
  // Blocks per mainnet epoch is computed as `Math.floor(12s / AVG_BLOCK_TIME)` and hard-coded.
  // Default is 1
  readonly blockPerMainnetEpochForChainId: number
  readonly pendingTransactionsRetryOptions?: RetryOptions
  readonly docs: string
  readonly bridge?: string
  readonly explorer: string
  readonly infoLink: string
  readonly label: string
  readonly helpCenterUrl?: string
  readonly nativeCurrency: {
    name: string // e.g. 'Goerli ETH',
    symbol: string // e.g. 'gorETH',
    decimals: number // e.g. 18,
  }
  readonly color?: string
  readonly backgroundColor?: string
  readonly chainPriority: number // Higher priority chains show up first in the chain selector
  readonly supportsClientSideRouting: boolean
  readonly supportsGasEstimates?: true
  readonly isTestnetChain?: true
  readonly backendChain: BackendChain
  readonly rpcUrls: RPCUrls
  readonly subgraphUrl?: string
  // Stablecoin amounts used when calculating spot price for a given currency.
  // The amount is large enough to filter low liquidity pairs.
  readonly spotPriceStablecoinAmount: CurrencyAmount<Token>
  readonly stablecoins: Token[]
  readonly assetRepoNetworkName?: string // Name used to index the network on this repo: https://github.com/Uniswap/assets/
}

interface L1ChainInfo extends BaseChainInfo {
  readonly networkLayer: NetworkLayer.L1
}

export interface L2ChainInfo extends BaseChainInfo {
  readonly networkLayer: NetworkLayer.L2
  readonly bridge: string
  readonly statusPage?: string
}

export type ChainInfo = BaseChainInfo & (L1ChainInfo | L2ChainInfo)
type ChainInfoMap = { readonly [chainId in SupportedInterfaceChainId]: ChainInfo }

export const CHAIN_INFO: ChainInfoMap = {
  [ChainId.MAINNET]: {
    id: ChainId.MAINNET,
    name: 'mainnet',
    urlParam: 'ethereum',
    blockPerMainnetEpochForChainId: 1,
    networkLayer: NetworkLayer.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_1,
    chainPriority: 0,
    supportsClientSideRouting: true,
    supportsGasEstimates: true,
    backendChain: {
      chain: Chain.Ethereum,
      backendSupported: true,
    },
    rpcUrls: {
      safe: ['https://api.mycryptoapi.com/eth', 'https://cloudflare-eth.com'],
      fallback: ['https://rpc.ankr.com/eth', 'https://eth-mainnet.public.blastapi.io'],
      appOnly: [`https://mainnet.infura.io/v3/${INFURA_KEY}`, QUICKNODE_MAINNET_RPC_URL],
      infuraPrefix: 'mainnet',
    },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3?source=uniswap',
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_MAINNET, 100_000e6),
    stablecoins: [USDC_MAINNET, DAI, USDT],
    assetRepoNetworkName: 'ethereum',
  },
  [ChainId.GOERLI]: {
    id: ChainId.GOERLI,
    name: 'goerli',
    urlParam: 'goerli',
    blockPerMainnetEpochForChainId: 1,
    networkLayer: NetworkLayer.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://goerli.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Görli',
    nativeCurrency: { name: 'Görli Ether', symbol: 'görETH', decimals: 18 },
    color: darkTheme.chain_5,
    chainPriority: 0,
    supportsClientSideRouting: true,
    isTestnetChain: true,
    backendChain: {
      chain: Chain.EthereumGoerli,
      backendSupported: true,
    },
    rpcUrls: {
      safe: ['https://rpc.goerli.mudit.blog/'],
      fallback: ['https://rpc.ankr.com/eth_goerli'],
      appOnly: [`https://goerli.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'goerli',
    },
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_GOERLI, 10_000e6),
    stablecoins: [USDC_GOERLI],
  },
  [ChainId.SEPOLIA]: {
    id: ChainId.SEPOLIA,
    name: 'sepolia',
    urlParam: 'sepolia',
    blockPerMainnetEpochForChainId: 1,
    networkLayer: NetworkLayer.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://sepolia.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SepoliaETH', decimals: 18 },
    color: darkTheme.chain_5,
    chainPriority: 0,
    supportsClientSideRouting: true,
    isTestnetChain: true,
    backendChain: {
      chain: Chain.EthereumSepolia,
      backendSupported: true,
    },
    rpcUrls: {
      safe: ['https://rpc.sepolia.dev/'],
      fallback: [
        'https://rpc.sepolia.org/',
        'https://rpc2.sepolia.org/',
        'https://rpc.sepolia.online/',
        'https://www.sepoliarpc.space/',
        'https://rpc-sepolia.rockx.com/',
        'https://rpc.bordel.wtf/sepolia',
      ],
      appOnly: [`https://sepolia.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'sepolia',
    },
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_SEPOLIA, 10_000e6),
    stablecoins: [USDC_SEPOLIA],
  },
  [ChainId.OPTIMISM]: {
    id: ChainId.OPTIMISM,
    name: 'optimism',
    urlParam: 'optimism',
    blockPerMainnetEpochForChainId: 6,
    networkLayer: NetworkLayer.L2,
    blockWaitMsBeforeWarning: ms(`25m`),
    pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
    bridge: 'https://app.optimism.io/bridge',
    docs: 'https://optimism.io/',
    explorer: 'https://optimistic.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism/',
    label: 'Optimism',
    statusPage: 'https://optimism.io/status',
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_10,
    backgroundColor: darkTheme.chain_10_background,
    chainPriority: 2,
    supportsClientSideRouting: true,
    supportsGasEstimates: true,
    backendChain: {
      chain: Chain.Optimism,
      backendSupported: true,
    },
    rpcUrls: {
      safe: ['https://mainnet.optimism.io/'],
      fallback: ['https://rpc.ankr.com/optimism'],
      appOnly: [`https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'optimism-mainnet',
    },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis?source=uniswap',
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(DAI_OPTIMISM, 10_000e18),
    stablecoins: [USDC_OPTIMISM, DAI_OPTIMISM],
    assetRepoNetworkName: 'optimism',
  },
  [ChainId.OPTIMISM_GOERLI]: {
    id: ChainId.OPTIMISM_GOERLI,
    name: 'optimism_goerli',
    urlParam: 'optimism_goerli',
    blockPerMainnetEpochForChainId: 1,
    networkLayer: NetworkLayer.L2,
    blockWaitMsBeforeWarning: ms(`25m`),
    pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
    bridge: 'https://app.optimism.io/bridge',
    docs: 'https://optimism.io/',
    explorer: 'https://goerli-optimism.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/optimism/',
    label: 'Optimism Görli',
    statusPage: 'https://optimism.io/status',
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
    nativeCurrency: { name: 'Optimism Goerli Ether', symbol: 'görOpETH', decimals: 18 },
    color: darkTheme.chain_420,
    chainPriority: 2,
    supportsClientSideRouting: true,
    isTestnetChain: true,
    backendChain: {
      chain: Chain.Optimism,
      isSecondaryChain: true,
      backendSupported: true,
    },
    rpcUrls: {
      safe: ['https://goerli.optimism.io'],
      appOnly: [`https://optimism-goerli.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'optimism-goerli',
    },
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_OPTIMISM_GOERLI, 10_000e6),
    stablecoins: [USDC_OPTIMISM_GOERLI],
  },
  [ChainId.ARBITRUM_ONE]: {
    id: ChainId.ARBITRUM_ONE,
    name: 'arbitrum',
    urlParam: 'arbitrum',
    blockPerMainnetEpochForChainId: 46,
    networkLayer: NetworkLayer.L2,
    blockWaitMsBeforeWarning: ms(`10m`),
    pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://arbiscan.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum',
    label: 'Arbitrum',
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_42,
    backgroundColor: darkTheme.chain_42161_background,
    chainPriority: 1,
    supportsClientSideRouting: true,
    supportsGasEstimates: true,
    backendChain: {
      chain: Chain.Arbitrum,
      backendSupported: true,
    },
    rpcUrls: {
      safe: ['https://arb1.arbitrum.io/rpc'],
      fallback: ['https://arbitrum.public-rpc.com'],
      appOnly: [`https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`, QUICKNODE_ARBITRUM_RPC_URL],
      infuraPrefix: 'arbitrum-mainnet',
    },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-arbitrum-one?source=uniswap',
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10_000e6),
    stablecoins: [USDC_ARBITRUM, DAI_ARBITRUM_ONE],
    assetRepoNetworkName: 'arbitrum',
  },
  [ChainId.ARBITRUM_GOERLI]: {
    id: ChainId.ARBITRUM_GOERLI,
    name: 'arbitrum_goerli',
    urlParam: 'arbitrum_goerli',
    blockPerMainnetEpochForChainId: 1,
    networkLayer: NetworkLayer.L2,
    blockWaitMsBeforeWarning: ms(`10m`),
    pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    explorer: 'https://goerli.arbiscan.io/',
    infoLink: 'https://info.uniswap.org/#/arbitrum/',
    label: 'Arbitrum Goerli',
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
    nativeCurrency: { name: 'Goerli Arbitrum Ether', symbol: 'goerliArbETH', decimals: 18 },
    color: darkTheme.chain_421613,
    chainPriority: 1,
    supportsClientSideRouting: true,
    isTestnetChain: true,
    backendChain: {
      chain: Chain.Arbitrum,
      isSecondaryChain: true,
      backendSupported: true,
    },
    rpcUrls: {
      safe: ['https://goerli-rollup.arbitrum.io/rpc'],
      appOnly: [`https://arbitrum-goerli.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'arbitrum-goerli',
    },
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_ARBITRUM_GOERLI, 10_000e6),
    stablecoins: [USDC_ARBITRUM_GOERLI],
  },
  [ChainId.POLYGON]: {
    id: ChainId.POLYGON,
    name: 'polygon',
    urlParam: 'polygon',
    blockPerMainnetEpochForChainId: 5,
    networkLayer: NetworkLayer.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://wallet.polygon.technology/polygon/bridge',
    docs: 'https://polygon.io/',
    explorer: 'https://polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon',
    nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
    color: darkTheme.chain_137,
    backgroundColor: darkTheme.chain_137_background,
    chainPriority: 3,
    supportsClientSideRouting: true,
    supportsGasEstimates: true,
    backendChain: {
      chain: Chain.Polygon,
      backendSupported: true,
      nativeTokenBackendAddress: MATIC_POLYGON.address,
    },
    rpcUrls: {
      safe: [
        'https://polygon-rpc.com/',
        'https://rpc-mainnet.matic.network',
        'https://matic-mainnet.chainstacklabs.com',
        'https://rpc-mainnet.maticvigil.com',
        'https://rpc-mainnet.matic.quiknode.pro',
        'https://matic-mainnet-full-rpc.bwarelabs.com',
      ],
      appOnly: [`https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'polygon-mainnet',
    },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon?source=uniswap',
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_POLYGON, 10_000e6),
    stablecoins: [USDC_POLYGON, DAI_POLYGON],
    assetRepoNetworkName: 'polygon',
  },
  [ChainId.POLYGON_MUMBAI]: {
    id: ChainId.POLYGON_MUMBAI,
    name: 'polygon_mumbai',
    urlParam: 'polygon_mumbai',
    blockPerMainnetEpochForChainId: 1,
    networkLayer: NetworkLayer.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://wallet.polygon.technology/polygon/bridge/deposit',
    docs: 'https://polygon.io/',
    explorer: 'https://mumbai.polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon Mumbai',
    nativeCurrency: { name: 'Polygon Mumbai Matic', symbol: 'mMATIC', decimals: 18 },
    chainPriority: 3,
    supportsClientSideRouting: true,
    isTestnetChain: true,
    backendChain: {
      chain: Chain.Polygon,
      isSecondaryChain: true,
      backendSupported: true,
      nativeTokenBackendAddress: MATIC_POLYGON.address,
    },
    rpcUrls: {
      safe: [
        'https://matic-mumbai.chainstacklabs.com',
        'https://rpc-mumbai.maticvigil.com',
        'https://matic-testnet-archive-rpc.bwarelabs.com',
      ],
      appOnly: [`https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'polygon-mumbai',
    },
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_POLYGON_MUMBAI, 10_000e6),
    stablecoins: [USDC_POLYGON_MUMBAI],
  },
  [ChainId.CELO]: {
    id: ChainId.CELO,
    name: 'celo',
    urlParam: 'celo',
    blockPerMainnetEpochForChainId: 2,
    networkLayer: NetworkLayer.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://www.portalbridge.com/#/transfer',
    docs: 'https://docs.celo.org/',
    explorer: 'https://celoscan.io/',
    infoLink: 'https://info.uniswap.org/#/celo/',
    label: 'Celo',
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
    chainPriority: 7,
    supportsClientSideRouting: true,
    supportsGasEstimates: true,
    backendChain: {
      chain: Chain.Celo,
      backendSupported: true,
      nativeTokenBackendAddress: nativeOnChain(ChainId.CELO).wrapped.address,
    },
    rpcUrls: {
      safe: [`https://forno.celo.org`],
      appOnly: [`https://celo-mainnet.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'celo-mainnet',
    },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo?source=uniswap',
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(CUSD_CELO, 10_000e18),
    stablecoins: [USDC_CELO],
    assetRepoNetworkName: 'celo',
  },
  [ChainId.CELO_ALFAJORES]: {
    id: ChainId.CELO_ALFAJORES,
    name: 'celo_alfajores',
    urlParam: 'celo_alfajores',
    blockPerMainnetEpochForChainId: 1,
    networkLayer: NetworkLayer.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://www.portalbridge.com/#/transfer',
    docs: 'https://docs.celo.org/',
    explorer: 'https://alfajores-blockscout.celo-testnet.org/',
    infoLink: 'https://info.uniswap.org/#/celo/',
    label: 'Celo Alfajores',
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
    chainPriority: 7,
    supportsClientSideRouting: true,
    isTestnetChain: true,
    backendChain: {
      chain: Chain.Celo,
      isSecondaryChain: true,
      backendSupported: true,
      nativeTokenBackendAddress: nativeOnChain(ChainId.CELO_ALFAJORES).wrapped.address,
    },
    rpcUrls: {
      safe: [`https://alfajores-forno.celo-testnet.org`],
      appOnly: [`https://celo-alfajores.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'celo-alfajores',
    },
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(CUSD_CELO_ALFAJORES, 10_000e6),
    stablecoins: [USDC_CELO],
  },
  [ChainId.BNB]: {
    id: ChainId.BNB,
    name: 'bnb',
    urlParam: 'bnb',
    blockPerMainnetEpochForChainId: 4,
    networkLayer: NetworkLayer.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://cbridge.celer.network/1/56',
    docs: 'https://docs.bnbchain.org/',
    explorer: 'https://bscscan.com/',
    infoLink: 'https://info.uniswap.org/#/bnb/',
    label: 'BNB Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    color: darkTheme.chain_56,
    backgroundColor: darkTheme.chain_56_background,
    chainPriority: 5,
    supportsClientSideRouting: true,
    supportsGasEstimates: true,
    backendChain: {
      chain: Chain.Bnb,
      backendSupported: true,
    },
    rpcUrls: {
      safe: [
        'https://endpoints.omniatech.io/v1/bsc/mainnet/public',
        'https://bsc-mainnet.gateway.pokt.network/v1/lb/6136201a7bad1500343e248d',
        'https://1rpc.io/bnb',
        'https://bsc-dataseed3.binance.org',
        'https://bsc-dataseed2.defibit.io',
        'https://bsc-dataseed1.ninicoin.io',
        'https://binance.nodereal.io',
        'https://bsc-dataseed4.defibit.io',
        'https://rpc.ankr.com/bsc',
      ],
      appOnly: [QUICKNODE_BNB_RPC_URL],
    },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-bsc?source=uniswap',
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDT_BSC, 100e18),
    stablecoins: [USDC_BSC],
    assetRepoNetworkName: 'smartchain',
  },
  [ChainId.AVALANCHE]: {
    id: ChainId.AVALANCHE,
    name: 'avalanche',
    urlParam: 'avalanche',
    blockPerMainnetEpochForChainId: 6,
    networkLayer: NetworkLayer.L1,
    blockWaitMsBeforeWarning: ms(`10m`),
    bridge: 'https://core.app/bridge/',
    docs: 'https://docs.avax.network/',
    explorer: 'https://snowtrace.io/',
    infoLink: 'https://info.uniswap.org/#/avax/', // TODO(WEB-2336): Add avax support to info site
    label: 'Avalanche',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    color: darkTheme.chain_43114,
    backgroundColor: darkTheme.chain_43114_background,
    chainPriority: 6,
    supportsClientSideRouting: true,
    supportsGasEstimates: true,
    backendChain: {
      chain: Chain.Avalanche,
      backendSupported: false,
    },
    rpcUrls: {
      safe: ['https://api.avax.network/ext/bc/C/rpc', 'https://avalanche-c-chain.publicnode.com'],
      appOnly: [`https://avalanche-mainnet.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'avalanche-mainnet',
    },
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/lynnshaoyu/uniswap-v3-avax?source=uniswap',
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_AVALANCHE, 10_000e6),
    stablecoins: [USDC_AVALANCHE],
    assetRepoNetworkName: 'avalanchec',
  },
  [ChainId.BASE]: {
    id: ChainId.BASE,
    name: 'base',
    urlParam: 'base',
    blockPerMainnetEpochForChainId: 6,
    networkLayer: NetworkLayer.L2,
    blockWaitMsBeforeWarning: ms(`25m`),
    pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
    bridge: 'https://bridge.base.org/deposit',
    docs: 'https://docs.base.org',
    explorer: 'https://basescan.org/',
    infoLink: 'https://info.uniswap.org/#/base/',
    label: 'Base',
    statusPage: 'https://status.base.org/',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_84531,
    chainPriority: 4,
    supportsClientSideRouting: true,
    supportsGasEstimates: true,
    backendChain: {
      chain: Chain.Base,
      backendSupported: true,
    },
    rpcUrls: {
      safe: [
        'https://mainnet.base.org/',
        'https://developer-access-mainnet.base.org/',
        'https://base.gateway.tenderly.co',
        'https://base.publicnode.com',
      ],
      fallback: ['https://1rpc.io/base', 'https://base.meowrpc.com'],
      appOnly: [`https://base-mainnet.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'base-mainnet',
    },
    subgraphUrl: 'https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest?source=uniswap',
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_BASE, 10_000e6),
    assetRepoNetworkName: 'base',
    stablecoins: [USDC_BASE],
  },
  [ChainId.BLAST]: {
    id: ChainId.BLAST,
    name: 'blast',
    urlParam: 'blast',
    blockPerMainnetEpochForChainId: 1,
    networkLayer: NetworkLayer.L2,
    pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
    bridge: 'https://blast.io/bridge',
    docs: 'https://docs.blast.io',
    explorer: 'https://blastscan.io/',
    infoLink: 'https://info.uniswap.org/#/blast/',
    label: 'Blast',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    color: darkTheme.chain_81457,
    chainPriority: 8,
    supportsClientSideRouting: false,
    supportsGasEstimates: true,
    backendChain: {
      chain: Chain.Blast,
      backendSupported: true,
    },
    rpcUrls: {
      safe: [
        'https://rpc.blast.io/',
        'https://rpc.ankr.com/blast',
        'https://blast.din.dev/rpc',
        'https://blastl2-mainnet.public.blastapi.io',
        'https://blast.blockpi.network/v1/rpc/public',
      ],
      appOnly: [`https://blast-mainnet.infura.io/v3/${INFURA_KEY}`],
      infuraPrefix: 'blast-mainnet',
    },
    subgraphUrl:
      'https://gateway-arbitrum.network.thegraph.com/api/0ae45f0bf40ae2e73119b44ccd755967/subgraphs/id/2LHovKznvo8YmKC9ZprPjsYAZDCc4K5q4AYz8s3cnQn1',
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDB_BLAST, 10_000e18),
    stablecoins: [USDB_BLAST],
    assetRepoNetworkName: 'blast',
  },
} as const

export function getChainInfo(options: { chainId: SupportedInterfaceChainId }): ChainInfo
export function getChainInfo(options: { chainId?: SupportedInterfaceChainId; withFallback: true }): ChainInfo
export function getChainInfo(options: {
  chainId?: SupportedInterfaceChainId
  withFallback?: boolean
}): ChainInfo | undefined
export function getChainInfo({
  chainId,
  withFallback,
}: {
  chainId?: SupportedInterfaceChainId
  withFallback?: boolean
}): ChainInfo | undefined {
  return chainId ? CHAIN_INFO[chainId] : withFallback ? CHAIN_INFO[ChainId.MAINNET] : undefined
}

export const CHAIN_IDS_TO_NAMES = Object.fromEntries(
  Object.entries(CHAIN_INFO).map(([key, value]) => [key, value.name])
) as { [chainId in SupportedInterfaceChainId]: string }

export const GQL_MAINNET_CHAINS = Object.values(CHAIN_INFO)
  .filter((chain) => !chain.isTestnetChain && !chain.backendChain.isSecondaryChain)
  .map((chain) => chain.backendChain.chain)

const GQL_TESTNET_CHAINS = Object.values(CHAIN_INFO)
  .filter((chain) => chain.isTestnetChain && !chain.backendChain.isSecondaryChain)
  .map((chain) => chain.backendChain.chain)

export const UX_SUPPORTED_GQL_CHAINS = [...GQL_MAINNET_CHAINS, ...GQL_TESTNET_CHAINS]

export const CHAIN_ID_TO_BACKEND_NAME = Object.fromEntries(
  Object.entries(CHAIN_INFO).map(([key, value]) => [key, value.backendChain.chain])
) as { [chainId in SupportedInterfaceChainId]: InterfaceGqlChain }

export function chainIdToBackendChain(options: { chainId: SupportedInterfaceChainId }): InterfaceGqlChain
export function chainIdToBackendChain(options: {
  chainId?: SupportedInterfaceChainId
  withFallback: true
}): InterfaceGqlChain
export function chainIdToBackendChain(options: {
  chainId?: SupportedInterfaceChainId
  withFallback?: boolean
}): InterfaceGqlChain | undefined
export function chainIdToBackendChain({
  chainId,
  withFallback,
}: {
  chainId?: SupportedInterfaceChainId
  withFallback?: boolean
}): InterfaceGqlChain | undefined {
  return chainId
    ? CHAIN_ID_TO_BACKEND_NAME[chainId]
    : withFallback
    ? CHAIN_ID_TO_BACKEND_NAME[ChainId.MAINNET]
    : undefined
}

export const CHAIN_NAME_TO_CHAIN_ID = Object.fromEntries(
  Object.entries(CHAIN_INFO)
    .filter(([, value]) => !value.backendChain.isSecondaryChain)
    .map(([key, value]) => [value.backendChain.chain, parseInt(key) as SupportedInterfaceChainId])
) as { [chain in InterfaceGqlChain]: SupportedInterfaceChainId }

export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = Object.keys(CHAIN_INFO)
  .filter((key) => CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].supportsGasEstimates)
  .map((key) => parseInt(key) as SupportedInterfaceChainId)

export const TESTNET_CHAIN_IDS = Object.keys(CHAIN_INFO)
  .filter((key) => CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].isTestnetChain)
  .map((key) => parseInt(key) as SupportedInterfaceChainId)

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
export const L1_CHAIN_IDS = Object.keys(CHAIN_INFO)
  .filter((key) => CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].networkLayer === NetworkLayer.L1)
  .map((key) => parseInt(key) as SupportedInterfaceChainId)

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
export const L2_CHAIN_IDS = Object.keys(CHAIN_INFO)
  .filter((key) => CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].networkLayer === NetworkLayer.L2)
  .map((key) => parseInt(key) as SupportedInterfaceChainId)

export type SupportedL2ChainId = (typeof L2_CHAIN_IDS)[number]

/**
 * @deprecated when v2 pools are enabled on chains supported through sdk-core
 */
export const SUPPORTED_V2POOL_CHAIN_IDS_DEPRECATED = [ChainId.MAINNET, ChainId.GOERLI] as const
export const SUPPORTED_V2POOL_CHAIN_IDS = Object.keys(V2_ROUTER_ADDRESSES).map((chainId) => parseInt(chainId))

export const BACKEND_SUPPORTED_CHAINS = Object.keys(CHAIN_INFO)
  .filter((key) => {
    const chainId = parseInt(key) as SupportedInterfaceChainId
    return (
      CHAIN_INFO[chainId].backendChain.backendSupported &&
      !CHAIN_INFO[chainId].backendChain.isSecondaryChain &&
      !CHAIN_INFO[chainId].isTestnetChain
    )
  })
  .map((key) => CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].backendChain.chain as InterfaceGqlChain)

export const BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS = GQL_MAINNET_CHAINS.filter(
  (chain) => !BACKEND_SUPPORTED_CHAINS.includes(chain)
).map((chain) => CHAIN_NAME_TO_CHAIN_ID[chain]) as [SupportedInterfaceChainId]

export const APP_RPC_URLS = Object.fromEntries(
  Object.entries(CHAIN_INFO).map(([key, value]) => [parseInt(key) as SupportedInterfaceChainId, value.rpcUrls.appOnly])
) as Record<SupportedInterfaceChainId, string[]>

export const PUBLIC_RPC_URLS = Object.fromEntries(
  Object.entries(CHAIN_INFO).map(([key, value]) => [
    parseInt(key) as SupportedInterfaceChainId,
    [...value.rpcUrls.safe, ...(value.rpcUrls.fallback ?? [])],
  ])
) as Record<SupportedInterfaceChainId, string[]>

export const INFURA_PREFIX_TO_CHAIN_ID: { [prefix: string]: SupportedInterfaceChainId } = Object.fromEntries(
  Object.entries(CHAIN_INFO)
    .filter(([, value]) => !!value.rpcUrls.infuraPrefix)
    .map(([key, value]) => [value.rpcUrls.infuraPrefix, parseInt(key) as SupportedInterfaceChainId])
)

export const CHAIN_SUBGRAPH_URL = Object.fromEntries(
  Object.entries(CHAIN_INFO)
    .filter(([, value]) => !!value.subgraphUrl)
    .map(([key, value]) => [parseInt(key) as SupportedInterfaceChainId, value.subgraphUrl])
) as Record<SupportedInterfaceChainId, string>

/**
 * Get the priority of a chainId based on its relevance to the user.
 * @param {ChainId} chainId - The chainId to determine the priority for.
 * @returns {number} The priority of the chainId, the lower the priority, the earlier it should be displayed, with base of MAINNET=0.
 */
export function getChainPriority(chainId: ChainId): number {
  if (isSupportedChainId(chainId)) {
    return CHAIN_INFO[chainId].chainPriority
  }

  return Infinity
}

export function isUniswapXSupportedChain(chainId: number) {
  return chainId === ChainId.MAINNET
}

export function isStablecoin(currency?: Currency): boolean {
  if (!currency) return false

  return getChainInfo({ chainId: currency.chainId as SupportedInterfaceChainId }).stablecoins.some((stablecoin) =>
    stablecoin.equals(currency)
  )
}

export function getChainFromChainUrlParam(chainUrlParam?: ChainSlug): ChainInfo | undefined {
  return chainUrlParam !== undefined
    ? Object.values(CHAIN_INFO).find((chain) => chainUrlParam === chain.urlParam)
    : undefined
}

export function useChainFromUrlParam(): ChainInfo | undefined {
  return getChainFromChainUrlParam(getChainUrlParam(useParams<{ chainName?: string }>().chainName))
}
