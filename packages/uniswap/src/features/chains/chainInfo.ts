/* eslint-disable max-lines */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CurrencyAmount, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import { ETH_LOGO, SMARTBCH_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { FLEX_USD } from 'uniswap/src/constants/tokens'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  RetryOptions,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const LOCAL_MAINNET_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8545'
const LOCAL_BASE_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8546'

/** Address that represents native currencies on ETH, Arbitrum, etc. */
export const DEFAULT_NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 10, minWait: 250, maxWait: 1000 }

export const DEFAULT_MS_BEFORE_WARNING = ONE_MINUTE_MS * 10

export function getChainInfo(chainId: UniverseChainId): UniverseChainInfo {
  return UNIVERSE_CHAIN_INFO[chainId] ?? UNIVERSE_CHAIN_INFO[10000]
}

// Source: https://marketplace.quicknode.com/chains_and_networks
export function getQuicknodeChainId(chainId: UniverseChainId): string {
  switch (chainId) {
    case UniverseChainId.Mainnet:
      return ''
    case UniverseChainId.SmartBCH:
      return 'smartbch-mainnet'
    default:
      throw new Error(`Chain ${chainId} does not have a corresponding QuickNode chain ID`)
  }
}

// If chain requires a path suffix
export function getQuicknodeChainIdPathSuffix(chainId: UniverseChainId): string {
  switch (chainId) {
    default:
      return ''
  }
}

export function getQuicknodeEndpointUrl(chainId: UniverseChainId): string {
  const quicknodeChainId = getQuicknodeChainId(chainId)

  return `https://${config.quicknodeEndpointName}${quicknodeChainId ? `.${quicknodeChainId}` : ''}.quiknode.pro/${config.quicknodeEndpointToken}${getQuicknodeChainIdPathSuffix(chainId)}`
}

function getPlaywrightRpcUrls(url: string): { [key in RPCType]: { http: string[] } } {
  return {
    [RPCType.Public]: { http: [url] },
    [RPCType.Default]: { http: [url] },
    [RPCType.Fallback]: { http: [url] },
    [RPCType.Interface]: { http: [url] },
    [RPCType.Private]: { http: [url] },
    [RPCType.PublicAlt]: { http: [url] },
  }
}

export const UNIVERSE_CHAIN_INFO: Partial<Record<UniverseChainId, UniverseChainInfo>> = {
  [UniverseChainId.SmartBCH]: {
    id: UniverseChainId.SmartBCH,
    sdkId: 10000 as UniswapSDKChainId,
    rpcUrls: {
      [RPCType.Default]: {
        http: ['https://smartbch.greyh.at'],
      },
      [RPCType.Interface]: {
        http: ['https://smartbch.greyh.at'],
      },
    },
    assetRepoNetworkName: 'smartbch',
    backendChain: {
      // leave something valid here so it doesn't error the request
      chain: BackendChainId.Arbitrum as GqlChainId,
      backendSupported: false,
      isSecondaryChain: false,
      nativeTokenBackendAddress: undefined,
    },
    blockPerMainnetEpochForChainId: 46,
    blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
    bridge: 'https://bridge.arbitrum.io/',
    docs: 'https://offchainlabs.com/',
    elementName: ElementName.ChainArbitrum,
    explorer: {
      name: 'Arbiscan',
      url: 'https://arbiscan.io/',
      apiURL: 'https://api.arbiscan.io',
    },
    helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
    infoLink: 'https://app.uniswap.org/explore/tokens/arbitrum',
    infuraPrefix: 'smartbch-mainnet',
    interfaceName: 'smartbch',
    label: 'smartBCH',
    logo: SMARTBCH_LOGO,
    name: 'smartBCH',
    nativeCurrency: {
      name: 'Bitcoin Cash',
      symbol: 'BCH',
      decimals: 8,
      address: DEFAULT_NATIVE_ADDRESS,
      explorerLink: 'https://www.smartscout.cash',
      logo: ETH_LOGO,
    },
    networkLayer: NetworkLayer.L2,
    pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(FLEX_USD, 100_000e6),
    stablecoins: [],
    statusPage: undefined,
    supportsInterfaceClientSideRouting: true,
    supportsGasEstimates: true,
    supportsV4: true,
    urlParam: 'smartbch',
    wrappedNativeCurrency: {
      name: 'Bitcoin Cash',
      symbol: 'BCH',
      decimals: 8,
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    },
  },
}

export const GQL_MAINNET_CHAINS = Object.values(UNIVERSE_CHAIN_INFO)
  .filter((chain) => !chain.testnet && !chain.backendChain.isSecondaryChain)
  .map((chain) => chain.backendChain.chain)
  .filter((backendChain) => !!backendChain)

export const GQL_TESTNET_CHAINS = Object.values(UNIVERSE_CHAIN_INFO)
  .filter((chain) => chain.testnet && !chain.backendChain.isSecondaryChain)
  .map((chain) => chain.backendChain.chain)
  .filter((backendChain) => !!backendChain)

export const ALL_GQL_CHAINS: GqlChainId[] = [...GQL_MAINNET_CHAINS, ...GQL_TESTNET_CHAINS]
