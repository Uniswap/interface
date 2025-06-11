/* eslint-disable max-lines */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CurrencyAmount, Token, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import { BCH_LOGO, ETHEREUM_LOGO, ETH_LOGO, SMARTBCH_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
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
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isInterface } from 'utilities/src/platform'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { mainnet } from 'wagmi/chains'

const FLEX_USD = new Token(
  UniverseChainId.SmartBCH,
  '0x7b2B3C5308ab5b2a1d9a94d20D35CCDf61e05b72',
  18,
  'flexUSD',
  'flexUSD',
)

const LOCAL_MAINNET_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8545'
const LOCAL_BASE_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8546'

/** Address that represents native currencies on ETH, Arbitrum, etc. */
export const DEFAULT_NATIVE_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
export const DEFAULT_RETRY_OPTIONS: RetryOptions = { n: 10, minWait: 250, maxWait: 1000 }

export const DEFAULT_MS_BEFORE_WARNING = ONE_MINUTE_MS * 10

export function getChainInfo(chainId: UniverseChainId): UniverseChainInfo {
  return UNIVERSE_CHAIN_INFO[chainId]
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

export const UNIVERSE_CHAIN_INFO: Record<UniverseChainId, UniverseChainInfo> = {
  [UniverseChainId.SmartBCH]: {
    id: UniverseChainId.SmartBCH,
    sdkId: 10000 as UniswapSDKChainId,
    rpcUrls: {
      [RPCType.Private]: {
        http: ['https://smartbch.greyh.at', 'https://smartbch.fountainhead.cash/mainnet'],
      },
      [RPCType.Public]: {
        http: ['https://smartbch.greyh.at', 'https://smartbch.fountainhead.cash/mainnet'],
      },
      [RPCType.Default]: {
        http: ['https://smartbch.greyh.at', 'https://smartbch.fountainhead.cash/mainnet'],
      },
      [RPCType.Interface]: {
        http: ['https://smartbch.greyh.at', 'https://smartbch.fountainhead.cash/mainnet'],
      },
      [RPCType.Fallback]: {
        http: ['https://smartbch.greyh.at', 'https://smartbch.fountainhead.cash/mainnet'],
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
      name: 'SmartScout',
      url: 'https://www.smartscout.cash/',
      apiURL: 'https://api.smartscout.cash',
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
      decimals: 18,
      address: DEFAULT_NATIVE_ADDRESS,
      explorerLink: 'https://www.smartscout.cash',
      logo: BCH_LOGO,
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
      symbol: 'WBCH',
      decimals: 8,
      address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    },
  },
  [UniverseChainId.Mainnet]: {
    ...mainnet,
    id: UniverseChainId.Mainnet,
    sdkId: UniswapSDKChainId.MAINNET,
    assetRepoNetworkName: 'ethereum',
    backendChain: {
      chain: BackendChainId.Ethereum as GqlChainId,
      backendSupported: true,
      isSecondaryChain: false,
      nativeTokenBackendAddress: undefined,
    },
    blockPerMainnetEpochForChainId: 1,
    blockWaitMsBeforeWarning: isInterface ? DEFAULT_MS_BEFORE_WARNING : ONE_MINUTE_MS,
    bridge: undefined,
    docs: 'https://docs.uniswap.org/',
    elementName: ElementName.ChainEthereum,
    explorer: {
      name: 'Etherscan',
      url: 'https://etherscan.io/',
      apiURL: 'https://api.etherscan.io',
    },
    helpCenterUrl: undefined,
    infoLink: 'https://app.uniswap.org/explore',
    infuraPrefix: 'mainnet',
    interfaceName: 'mainnet',
    label: 'Ethereum',
    logo: ETHEREUM_LOGO,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      address: DEFAULT_NATIVE_ADDRESS,
      explorerLink: 'https://etherscan.io/chart/etherprice',
      logo: ETH_LOGO,
    },
    networkLayer: NetworkLayer.L1,
    pendingTransactionsRetryOptions: undefined,
    rpcUrls: isPlaywrightEnv()
      ? getPlaywrightRpcUrls(LOCAL_MAINNET_PLAYWRIGHT_RPC_URL)
      : {
          [RPCType.Private]: {
            http: ['https://rpc.mevblocker.io/?referrer=uniswapwallet'],
          },
          [RPCType.Public]: {
            http: [getQuicknodeEndpointUrl(UniverseChainId.Mainnet)],
          },
          [RPCType.Default]: {
            http: [getQuicknodeEndpointUrl(UniverseChainId.Mainnet)],
          },
          [RPCType.Fallback]: {
            http: ['https://rpc.ankr.com/eth', 'https://eth-mainnet.public.blastapi.io'],
          },
          [RPCType.Interface]: {
            http: [
              `https://mainnet.infura.io/v3/${config.infuraKey}`,
              getQuicknodeEndpointUrl(UniverseChainId.Mainnet),
            ],
          },
        },
    urlParam: 'ethereum',
    statusPage: undefined,
    spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(FLEX_USD, 100_000e6),
    stablecoins: [],
    supportsInterfaceClientSideRouting: true,
    supportsGasEstimates: true,
    supportsV4: true,
    wrappedNativeCurrency: {
      name: 'Wrapped Ether',
      symbol: 'WETH',
      decimals: 18,
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    },
  } as const satisfies UniverseChainInfo,
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
