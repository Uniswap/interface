/* eslint-disable rulesdir/no-undefined-or */
import { ChainId, Currency, CurrencyAmount, Token, V2_ROUTER_ADDRESSES } from '@uniswap/sdk-core'
import {
  //CUSD_CELO,
  CUSD_CELO_ALFAJORES,
  DAI,
  DAI_ARBITRUM_ONE,
  DAI_OPTIMISM,
  DAI_POLYGON,
  MATIC_POLYGON,
  //USDB_BLAST,
  USDC_ARBITRUM,
  USDC_ARBITRUM_GOERLI,
  //USDC_AVALANCHE,
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
import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { RetryOptions } from 'state/activity/polling/retry'
import { darkTheme } from 'theme/colors'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ElementName, ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { Chain } from 'viem'
import {
  Prettify,
  arbitrum,
  arbitrumGoerli,
  //avalanche,
  base,
  //blast,
  bsc,
  //celo,
  celoAlfajores,
  goerli,
  mainnet,
  optimism,
  optimismGoerli,
  polygon,
  polygonMumbai,
  sepolia,
} from 'wagmi/chains'

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
  //ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.BNB,
  //ChainId.AVALANCHE,
  ChainId.BASE,
  //ChainId.BLAST,
] as const

export function isSupportedChainId(chainId?: number | ChainId | null): chainId is SupportedInterfaceChainId {
  return !!chainId && SUPPORTED_INTERFACE_CHAIN_IDS.includes(chainId as SupportedInterfaceChainId)
}

// Used to feature flag chains. If a chain is not included in the object, it is considered enabled by default.
// This is the reason why useSupportedChainId and useIsSupportedChainId is a hook instead of a function.
function useFeatureFlaggedChainIds(): Partial<Record<SupportedInterfaceChainId, boolean>> {
  // You can use the useFeatureFlag hook here to enable/disable chains based on feature flags.
  // Example: [ChainId.BLAST]: useFeatureFlag(FeatureFlags.BLAST)
  return useMemo(() => ({}), [])
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

export enum NetworkLayer {
  L1,
  L2,
}

export type InterfaceGqlChain = Exclude<BackendChainId, BackendChainId.UnknownChain>

interface BackendChain {
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

// TODO: https://linear.app/uniswap/issue/WEB-4058/chain-info-using-wagmi-chain-interface
// Add createChainInfo function that appropriately sets the default values for each chain
type ChainInfo = Prettify<
  Chain & {
    readonly id: ChainId
    readonly interfaceName: string
    readonly urlParam: string
    // eslint-disable-next-line rulesdir/no-undefined-or
    readonly blockWaitMsBeforeWarning: number | undefined
    // Average block times were pulled from https://dune.com/jacobdcastro/avg-block-times on 2024-03-14,
    // and corroborated with that chain's documentation/explorer.
    // Blocks per mainnet epoch is computed as `Math.floor(12s / AVG_BLOCK_TIME)` and hard-coded.
    // Default is 1
    readonly blockPerMainnetEpochForChainId: number
    readonly pendingTransactionsRetryOptions: RetryOptions | undefined
    readonly docs: string
    readonly infoLink: string
    readonly label: string
    readonly elementName: ElementNameType
    // The label for this chain, derived from the MetaMask "Safe" list.
    // This is only needed if the default label does not match MetaMask's.
    readonly helpCenterUrl: string | undefined
    readonly color: string | undefined
    readonly backgroundColor: string | undefined
    readonly chainPriority: number // Higher priority chains show up first in the chain selector
    readonly supportsClientSideRouting: boolean
    readonly supportsGasEstimates: boolean
    readonly backendChain: BackendChain
    readonly subgraphUrl: string | undefined
    // Stablecoin amounts used when calculating spot price for a given currency.
    // The amount is large enough to filter low liquidity pairs.
    readonly spotPriceStablecoinAmount: CurrencyAmount<Token>
    readonly stablecoins: Token[]
    readonly assetRepoNetworkName: string | undefined // Name used to index the network on this repo: https://github.com/Uniswap/assets/
    readonly infuraPrefix: string | undefined
    readonly networkLayer: NetworkLayer
    readonly bridge: string | undefined
    readonly statusPage: string | undefined
  }
>

const MAINNET = {
  ...mainnet,
  id: ChainId.MAINNET,
  interfaceName: 'mainnet',
  urlParam: 'ethereum',
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  pendingTransactionsRetryOptions: undefined,
  networkLayer: NetworkLayer.L1,
  docs: 'https://docs.uniswap.org/',
  infoLink: 'https://info.uniswap.org/#/',
  label: 'Ethereum',
  elementName: ElementName.ChainEthereum,
  helpCenterUrl: undefined,
  backgroundColor: undefined,
  color: darkTheme.chain_1,
  chainPriority: 0,
  supportsClientSideRouting: true,
  supportsGasEstimates: true,
  backendChain: {
    chain: BackendChainId.Ethereum,
    backendSupported: true,
    isSecondaryChain: false,
    nativeTokenBackendAddress: undefined,
  },
  rpcUrls: {
    default: {
      http: ['https://cloudflare-eth.com'],
    },
    fallback: {
      http: ['https://rpc.ankr.com/eth', 'https://eth-mainnet.public.blastapi.io'],
    },
    appOnly: {
      http: [`https://mainnet.infura.io/v3/${INFURA_KEY}`, QUICKNODE_MAINNET_RPC_URL],
    },
  },
  subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3?source=uniswap',
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_MAINNET, 100_000e6),
  stablecoins: [USDC_MAINNET, DAI, USDT],
  assetRepoNetworkName: 'ethereum',
  infuraPrefix: 'mainnet',
  bridge: undefined,
  statusPage: undefined,
} as const satisfies ChainInfo

const GOERLI = {
  ...goerli,
  id: ChainId.GOERLI,
  interfaceName: 'goerli',
  urlParam: 'goerli',
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  pendingTransactionsRetryOptions: undefined,
  networkLayer: NetworkLayer.L1,
  docs: 'https://docs.uniswap.org/',
  infoLink: 'https://info.uniswap.org/#/',
  label: 'Görli',
  elementName: ElementName.ChainEthereumGoerli,
  helpCenterUrl: undefined,
  color: darkTheme.chain_5,
  backgroundColor: undefined,
  chainPriority: 0,
  supportsClientSideRouting: true,
  supportsGasEstimates: false,
  backendChain: {
    chain: BackendChainId.EthereumGoerli,
    backendSupported: true,
    isSecondaryChain: false,
    nativeTokenBackendAddress: undefined,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.goerli.mudit.blog/'],
    },
    fallback: {
      http: ['https://rpc.ankr.com/eth_goerli'],
    },
    appOnly: {
      http: [`https://goerli.infura.io/v3/${INFURA_KEY}`],
    },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_GOERLI, 10_000e6),
  stablecoins: [USDC_GOERLI],
  infuraPrefix: 'goerli',
  subgraphUrl: undefined,
  assetRepoNetworkName: undefined,
  bridge: undefined,
  statusPage: undefined,
} as const satisfies ChainInfo

const SEPOLIA = {
  ...sepolia,
  id: ChainId.SEPOLIA,
  interfaceName: 'sepolia',
  urlParam: 'sepolia',
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  pendingTransactionsRetryOptions: undefined,
  networkLayer: NetworkLayer.L1,
  docs: 'https://docs.uniswap.org/',
  infoLink: 'https://info.uniswap.org/#/',
  helpCenterUrl: undefined,
  label: 'Sepolia',
  elementName: ElementName.ChainSepolia,
  color: darkTheme.chain_5,
  backgroundColor: undefined,
  chainPriority: 0,
  supportsClientSideRouting: true,
  supportsGasEstimates: false,
  backendChain: {
    chain: BackendChainId.EthereumSepolia,
    backendSupported: true,
    isSecondaryChain: false,
    nativeTokenBackendAddress: undefined,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.org/'],
    },
    fallback: {
      http: [
        'https://rpc.sepolia.org/',
        'https://rpc2.sepolia.org/',
        'https://rpc.sepolia.online/',
        'https://www.sepoliarpc.space/',
        'https://rpc-sepolia.rockx.com/',
        'https://rpc.bordel.wtf/sepolia',
      ],
    },
    appOnly: { http: [`https://sepolia.infura.io/v3/${INFURA_KEY}`] },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_SEPOLIA, 10_000e6),
  stablecoins: [USDC_SEPOLIA],
  infuraPrefix: 'sepolia',
  subgraphUrl: undefined,
  assetRepoNetworkName: undefined,
  bridge: undefined,
  statusPage: undefined,
} as const satisfies ChainInfo

const OPTIMISM = {
  ...optimism,
  id: ChainId.OPTIMISM,
  interfaceName: 'optimism',
  urlParam: 'optimism',
  blockPerMainnetEpochForChainId: 6,
  networkLayer: NetworkLayer.L2,
  blockWaitMsBeforeWarning: ms(`25m`),
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  bridge: 'https://app.optimism.io/bridge',
  docs: 'https://optimism.io/',
  infoLink: 'https://info.uniswap.org/#/optimism/',
  label: 'Optimism',
  elementName: ElementName.ChainOptimism,
  statusPage: 'https://optimism.io/status',
  helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
  color: darkTheme.chain_10,
  backgroundColor: darkTheme.chain_10_background,
  chainPriority: 2,
  supportsClientSideRouting: true,
  supportsGasEstimates: true,
  backendChain: {
    chain: BackendChainId.Optimism,
    backendSupported: true,
    isSecondaryChain: false,
    nativeTokenBackendAddress: undefined,
  },
  rpcUrls: {
    default: { http: ['https://mainnet.optimism.io/'] },
    fallback: { http: ['https://rpc.ankr.com/optimism'] },
    appOnly: { http: [`https://optimism-mainnet.infura.io/v3/${INFURA_KEY}`] },
  },
  subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis?source=uniswap',
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(DAI_OPTIMISM, 10_000e18),
  stablecoins: [USDC_OPTIMISM, DAI_OPTIMISM],
  assetRepoNetworkName: 'optimism',
  infuraPrefix: 'optimism-mainnet',
} as const satisfies ChainInfo

const OPTIMISM_GOERLI = {
  ...optimismGoerli,
  id: ChainId.OPTIMISM_GOERLI,
  interfaceName: 'optimism_goerli',
  urlParam: 'optimism_goerli',
  blockPerMainnetEpochForChainId: 1,
  networkLayer: NetworkLayer.L2,
  blockWaitMsBeforeWarning: ms(`25m`),
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  bridge: 'https://app.optimism.io/bridge',
  docs: 'https://optimism.io/',
  infoLink: 'https://info.uniswap.org/#/optimism/',
  label: 'Optimism Görli',
  elementName: ElementName.ChainOptimismGoerli,
  statusPage: 'https://optimism.io/status',
  helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
  color: darkTheme.chain_420,
  backgroundColor: undefined,
  chainPriority: 2,
  supportsClientSideRouting: true,
  supportsGasEstimates: false,
  backendChain: {
    chain: BackendChainId.Optimism,
    isSecondaryChain: true,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  rpcUrls: {
    default: { http: ['https://goerli.optimism.io'] },
    appOnly: { http: [`https://optimism-goerli.infura.io/v3/${INFURA_KEY}`] },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_OPTIMISM_GOERLI, 10_000e6),
  stablecoins: [USDC_OPTIMISM_GOERLI],
  infuraPrefix: 'optimism-goerli',
  subgraphUrl: undefined,
  assetRepoNetworkName: undefined,
} as const satisfies ChainInfo

const ARBITRUM = {
  ...arbitrum,
  id: ChainId.ARBITRUM_ONE,
  interfaceName: 'arbitrum',
  urlParam: 'arbitrum',
  blockPerMainnetEpochForChainId: 46,
  networkLayer: NetworkLayer.L2,
  blockWaitMsBeforeWarning: ms(`10m`),
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  bridge: 'https://bridge.arbitrum.io/',
  docs: 'https://offchainlabs.com/',
  infoLink: 'https://info.uniswap.org/#/arbitrum',
  label: 'Arbitrum',
  elementName: ElementName.ChainArbitrum,
  helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
  color: darkTheme.chain_42,
  backgroundColor: darkTheme.chain_42161_background,
  chainPriority: 1,
  supportsClientSideRouting: true,
  supportsGasEstimates: true,
  backendChain: {
    chain: BackendChainId.Arbitrum,
    backendSupported: true,
    isSecondaryChain: false,
    nativeTokenBackendAddress: undefined,
  },
  rpcUrls: {
    default: { http: ['https://arb1.arbitrum.io/rpc'] },
    fallback: { http: ['https://arbitrum.public-rpc.com'] },
    appOnly: { http: [`https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`, QUICKNODE_ARBITRUM_RPC_URL] },
  },
  subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-arbitrum-one?source=uniswap',
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10_000e6),
  stablecoins: [USDC_ARBITRUM, DAI_ARBITRUM_ONE],
  assetRepoNetworkName: 'arbitrum',
  infuraPrefix: 'arbitrum-mainnet',
  statusPage: undefined,
} as const satisfies ChainInfo

const ARBITRUM_GOERLI = {
  ...arbitrumGoerli,
  id: ChainId.ARBITRUM_GOERLI,
  interfaceName: 'arbitrum_goerli',
  urlParam: 'arbitrum_goerli',
  blockPerMainnetEpochForChainId: 1,
  networkLayer: NetworkLayer.L2,
  blockWaitMsBeforeWarning: ms(`10m`),
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  bridge: 'https://bridge.arbitrum.io/',
  docs: 'https://offchainlabs.com/',
  infoLink: 'https://info.uniswap.org/#/arbitrum/',
  label: 'Arbitrum Goerli',
  elementName: ElementName.ChainArbitrumGoerli,
  helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
  color: darkTheme.chain_421613,
  backgroundColor: undefined,
  chainPriority: 1,
  supportsClientSideRouting: true,
  supportsGasEstimates: false,
  backendChain: {
    chain: BackendChainId.Arbitrum,
    isSecondaryChain: true,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  rpcUrls: {
    default: { http: ['https://goerli-rollup.arbitrum.io/rpc'] },
    appOnly: { http: [`https://arbitrum-goerli.infura.io/v3/${INFURA_KEY}`] },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_ARBITRUM_GOERLI, 10_000e6),
  stablecoins: [USDC_ARBITRUM_GOERLI],
  infuraPrefix: 'arbitrum-goerli',
  subgraphUrl: undefined,
  assetRepoNetworkName: undefined,
  statusPage: undefined,
} as const satisfies ChainInfo

const POLYGON = {
  ...polygon,
  id: ChainId.POLYGON,
  name: 'Polygon Mainnet',
  interfaceName: 'polygon',
  urlParam: 'polygon',
  blockPerMainnetEpochForChainId: 5,
  networkLayer: NetworkLayer.L1,
  blockWaitMsBeforeWarning: ms(`10m`),
  pendingTransactionsRetryOptions: undefined,
  bridge: 'https://wallet.polygon.technology/polygon/bridge',
  docs: 'https://polygon.io/',
  infoLink: 'https://info.uniswap.org/#/polygon/',
  helpCenterUrl: undefined,
  label: 'Polygon',
  elementName: ElementName.ChainPolygon,
  color: darkTheme.chain_137,
  backgroundColor: darkTheme.chain_137_background,
  chainPriority: 3,
  supportsClientSideRouting: true,
  supportsGasEstimates: true,
  backendChain: {
    chain: BackendChainId.Polygon,
    backendSupported: true,
    nativeTokenBackendAddress: MATIC_POLYGON.address,
    isSecondaryChain: false,
  },
  rpcUrls: {
    default: { http: ['https://polygon-rpc.com/'] },
    appOnly: { http: [`https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`] },
  },
  subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon?source=uniswap',
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_POLYGON, 10_000e6),
  stablecoins: [USDC_POLYGON, DAI_POLYGON],
  assetRepoNetworkName: 'polygon',
  infuraPrefix: 'polygon-mainnet',
  statusPage: undefined,
} as const satisfies ChainInfo

const POLYGON_MUMBAI = {
  ...polygonMumbai,
  id: ChainId.POLYGON_MUMBAI,
  interfaceName: 'polygon_mumbai',
  urlParam: 'polygon_mumbai',
  blockPerMainnetEpochForChainId: 1,
  networkLayer: NetworkLayer.L1,
  blockWaitMsBeforeWarning: ms(`10m`),
  pendingTransactionsRetryOptions: undefined,
  bridge: 'https://wallet.polygon.technology/polygon/bridge/deposit',
  docs: 'https://polygon.io/',
  infoLink: 'https://info.uniswap.org/#/polygon/',
  helpCenterUrl: undefined,
  label: 'Polygon Mumbai',
  elementName: ElementName.ChainPolygonMumbai,
  color: darkTheme.chain_137,
  backgroundColor: darkTheme.chain_137_background,
  chainPriority: 3,
  supportsClientSideRouting: true,
  supportsGasEstimates: false,
  backendChain: {
    chain: BackendChainId.Polygon,
    isSecondaryChain: true,
    backendSupported: true,
    nativeTokenBackendAddress: MATIC_POLYGON.address,
  },
  rpcUrls: {
    default: { http: ['https://rpc-mumbai.maticvigil.com'] },
    appOnly: { http: [`https://polygon-mumbai.infura.io/v3/${INFURA_KEY}`] },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_POLYGON_MUMBAI, 10_000e6),
  stablecoins: [USDC_POLYGON_MUMBAI],
  infuraPrefix: 'polygon-mumbai',
  assetRepoNetworkName: undefined,
  subgraphUrl: undefined,
  statusPage: undefined,
} as const satisfies ChainInfo

const CELO_ALFAJORES = {
  ...celoAlfajores,
  id: ChainId.CELO_ALFAJORES,
  interfaceName: 'celo_alfajores',
  urlParam: 'celo_alfajores',
  blockPerMainnetEpochForChainId: 1,
  networkLayer: NetworkLayer.L1,
  blockWaitMsBeforeWarning: ms(`10m`),
  pendingTransactionsRetryOptions: undefined,
  bridge: 'https://www.portalbridge.com/#/transfer',
  docs: 'https://docs.celo.org/',
  infoLink: 'https://info.uniswap.org/#/celo/',
  helpCenterUrl: undefined,
  label: 'Celo Alfajores',
  elementName: ElementName.ChainCeloAlfajores,
  chainPriority: 7,
  color: undefined,
  backgroundColor: undefined,
  supportsClientSideRouting: true,
  supportsGasEstimates: false,
  backendChain: {
    chain: BackendChainId.Celo,
    isSecondaryChain: true,
    backendSupported: true,
    nativeTokenBackendAddress: nativeOnChain(ChainId.CELO_ALFAJORES).wrapped.address,
  },
  rpcUrls: {
    default: { http: [`https://alfajores-forno.celo-testnet.org`] },
    appOnly: { http: [`https://celo-alfajores.infura.io/v3/${INFURA_KEY}`] },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(CUSD_CELO_ALFAJORES, 10_000e6),
  stablecoins: [USDC_CELO],
  infuraPrefix: 'celo-alfajores',
  assetRepoNetworkName: undefined,
  subgraphUrl: undefined,
  statusPage: undefined,
} as const satisfies ChainInfo

const BNB = {
  ...bsc,
  id: ChainId.BNB,
  name: 'BNB Smart Chain Mainnet',
  interfaceName: 'bnb',
  urlParam: 'bnb',
  blockPerMainnetEpochForChainId: 4,
  networkLayer: NetworkLayer.L1,
  blockWaitMsBeforeWarning: ms(`10m`),
  pendingTransactionsRetryOptions: undefined,
  bridge: 'https://cbridge.celer.network/1/56',
  docs: 'https://docs.bnbchain.org/',
  infoLink: 'https://info.uniswap.org/#/bnb/',
  label: 'BNB Chain',
  elementName: ElementName.ChainBNB,
  helpCenterUrl: undefined,
  color: darkTheme.chain_56,
  backgroundColor: darkTheme.chain_56_background,
  chainPriority: 5,
  supportsClientSideRouting: true,
  supportsGasEstimates: true,
  backendChain: {
    chain: BackendChainId.Bnb,
    backendSupported: true,
    isSecondaryChain: false,
    nativeTokenBackendAddress: undefined,
  },
  rpcUrls: {
    default: { http: ['https://bsc-dataseed1.bnbchain.org'] },
    appOnly: { http: [QUICKNODE_BNB_RPC_URL] },
  },
  subgraphUrl: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-bsc?source=uniswap',
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDT_BSC, 100e18),
  stablecoins: [USDC_BSC],
  assetRepoNetworkName: 'smartchain',
  infuraPrefix: undefined,
  statusPage: undefined,
} as const satisfies ChainInfo

const BASE = {
  ...base,
  id: ChainId.BASE,
  interfaceName: 'base',
  urlParam: 'base',
  blockPerMainnetEpochForChainId: 6,
  networkLayer: NetworkLayer.L2,
  blockWaitMsBeforeWarning: ms(`25m`),
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  bridge: 'https://bridge.base.org/deposit',
  docs: 'https://docs.base.org',
  infoLink: 'https://info.uniswap.org/#/base/',
  helpCenterUrl: undefined,
  label: 'Base',
  elementName: ElementName.ChainBase,
  statusPage: 'https://status.base.org/',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  color: darkTheme.chain_84531,
  backgroundColor: undefined,
  chainPriority: 4,
  supportsClientSideRouting: true,
  supportsGasEstimates: true,
  backendChain: {
    chain: BackendChainId.Base,
    backendSupported: true,
    isSecondaryChain: false,
    nativeTokenBackendAddress: undefined,
  },
  rpcUrls: {
    default: { http: ['https://mainnet.base.org/'] },
    fallback: { http: ['https://1rpc.io/base', 'https://base.meowrpc.com'] },
    appOnly: { http: [`https://base-mainnet.infura.io/v3/${INFURA_KEY}`] },
  },
  subgraphUrl: 'https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest?source=uniswap',
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_BASE, 10_000e6),
  assetRepoNetworkName: 'base',
  stablecoins: [USDC_BASE],
  infuraPrefix: 'base-mainnet',
} as const satisfies ChainInfo

const INTERFACE_SUPPORTED_CHAINS = [
  MAINNET,
  GOERLI,
  SEPOLIA,
  OPTIMISM,
  OPTIMISM_GOERLI,
  ARBITRUM,
  ARBITRUM_GOERLI,
  POLYGON,
  POLYGON_MUMBAI,
  //AVALANCHE,
  //CELO,
  CELO_ALFAJORES,
  BNB,
  BASE,
  //BLAST,
] as const

type ExtractObject<TObject extends Record<string, unknown>, TNarrowedObject extends Partial<TObject>> = Extract<
  TObject,
  TNarrowedObject
>
export type SupportedInterfaceChain<
  partialChain extends Partial<(typeof INTERFACE_SUPPORTED_CHAINS)[number]> = Partial<
    (typeof INTERFACE_SUPPORTED_CHAINS)[number]
  >
> = ExtractObject<(typeof INTERFACE_SUPPORTED_CHAINS)[number], partialChain>
export type SupportedInterfaceChainId = SupportedInterfaceChain['id']
type ChainInfoMap = { readonly [chainId in SupportedInterfaceChainId]: SupportedInterfaceChain }

export const CHAIN_INFO: ChainInfoMap = {
  [ChainId.MAINNET]: MAINNET,
  [ChainId.GOERLI]: GOERLI,
  [ChainId.SEPOLIA]: SEPOLIA,
  [ChainId.OPTIMISM]: OPTIMISM,
  [ChainId.OPTIMISM_GOERLI]: OPTIMISM_GOERLI,
  [ChainId.ARBITRUM_ONE]: ARBITRUM,
  [ChainId.ARBITRUM_GOERLI]: ARBITRUM_GOERLI,
  [ChainId.POLYGON]: POLYGON,
  [ChainId.POLYGON_MUMBAI]: POLYGON_MUMBAI,
  //[ChainId.CELO]: CELO,
  [ChainId.CELO_ALFAJORES]: CELO_ALFAJORES,
  [ChainId.BNB]: BNB,
  //[ChainId.AVALANCHE]: AVALANCHE,
  [ChainId.BASE]: BASE,
  //[ChainId.BLAST]: BLAST,
} as const

export type ChainSlug = SupportedInterfaceChain['urlParam']
export const isChainUrlParam = (str?: string): str is ChainSlug =>
  !!str && Object.values(CHAIN_INFO).some((chain) => chain.urlParam === str)
export const getChainUrlParam = (str?: string): ChainSlug | undefined => (isChainUrlParam(str) ? str : undefined)

export function getChain(options: { chainId: SupportedInterfaceChainId }): SupportedInterfaceChain
export function getChain(options: { chainId?: SupportedInterfaceChainId; withFallback: true }): SupportedInterfaceChain
export function getChain(options: {
  chainId?: SupportedInterfaceChainId
  withFallback?: boolean
}): SupportedInterfaceChain | undefined
export function getChain({
  chainId,
  withFallback,
}: {
  chainId?: SupportedInterfaceChainId
  withFallback?: boolean
}): SupportedInterfaceChain | undefined {
  return chainId ? CHAIN_INFO[chainId] : withFallback ? CHAIN_INFO[ChainId.MAINNET] : undefined
}

export const CHAIN_IDS_TO_NAMES = Object.fromEntries(
  Object.entries(CHAIN_INFO).map(([key, value]) => [key, value.interfaceName])
) as { [chainId in SupportedInterfaceChainId]: string }

export const GQL_MAINNET_CHAINS = Object.values(CHAIN_INFO)
  .filter((chain) => !chain.testnet && !chain.backendChain.isSecondaryChain)
  .map((chain) => chain.backendChain.chain)

const GQL_TESTNET_CHAINS = Object.values(CHAIN_INFO)
  .filter((chain) => chain.testnet && !chain.backendChain.isSecondaryChain)
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
  .filter((key) => CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].testnet)
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
export const SUPPORTED_V2POOL_CHAIN_IDS = Object.keys(V2_ROUTER_ADDRESSES).map((chainId) => parseInt(chainId))

export const BACKEND_SUPPORTED_CHAINS = Object.keys(CHAIN_INFO)
  .filter((key) => {
    const chainId = parseInt(key) as SupportedInterfaceChainId
    return (
      CHAIN_INFO[chainId].backendChain.backendSupported &&
      !CHAIN_INFO[chainId].backendChain.isSecondaryChain &&
      !CHAIN_INFO[chainId].testnet
    )
  })
  .map((key) => CHAIN_INFO[parseInt(key) as SupportedInterfaceChainId].backendChain.chain as InterfaceGqlChain)

export const BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS = GQL_MAINNET_CHAINS.filter(
  (chain) => !BACKEND_SUPPORTED_CHAINS.includes(chain)
).map((chain) => CHAIN_NAME_TO_CHAIN_ID[chain]) as [SupportedInterfaceChainId]

export const INFURA_PREFIX_TO_CHAIN_ID: { [prefix: string]: SupportedInterfaceChainId } = Object.fromEntries(
  Object.entries(CHAIN_INFO)
    .filter(([, value]) => !!value.infuraPrefix)
    .map(([key, value]) => [value.infuraPrefix, parseInt(key) as SupportedInterfaceChainId])
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

// TODO: amend when adding UniswapX
export function isUniswapXSupportedChain(chainId?: number) {
  return chainId === 0
}

export function isStablecoin(currency?: Currency): boolean {
  if (!currency) {
    return false
  }

  return getChain({ chainId: currency.chainId as SupportedInterfaceChainId }).stablecoins.some((stablecoin) =>
    stablecoin.equals(currency)
  )
}

export function getChainFromChainUrlParam(chainUrlParam?: ChainSlug): SupportedInterfaceChain | undefined {
  return chainUrlParam !== undefined
    ? Object.values(CHAIN_INFO).find((chain) => chainUrlParam === chain.urlParam)
    : undefined
}

export function useChainFromUrlParam(): SupportedInterfaceChain | undefined {
  const chainName = useParams<{ chainName?: string }>().chainName
  // In the case where /explore/:chainName is used, the chainName is passed as a tab param
  const tab = useParams<{ tab?: string }>().tab
  return getChainFromChainUrlParam(getChainUrlParam(chainName ?? tab))
}
