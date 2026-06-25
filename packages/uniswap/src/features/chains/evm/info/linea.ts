import { Token } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { ETH_LOGO, LINEA_LOGO } from 'ui/src/assets'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
  getQuicknodeEndpointUrl,
  getUniRpcEndpointUrl,
} from 'uniswap/src/features/chains/evm/rpc'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import { GENERIC_L2_GAS_CONFIG } from 'uniswap/src/features/chains/gasDefaults'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { linea } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: new Token(UniverseChainId.Linea, '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', 6, 'USDC', 'USD Coin'),
    USDT: new Token(UniverseChainId.Linea, '0xA219439258ca9da29E9Cc4cE5596924745e12B93', 6, 'USDT', 'Tether USD'),
  },
})

export const LINEA_CHAIN_INFO = {
  ...linea,
  id: UniverseChainId.Linea,
  platform: Platform.EVM,
  assetRepoNetworkName: 'linea',
  backendChain: {
    chain: GraphQLApi.Chain.Linea as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  bridge: 'https://bridge.linea.build',
  docs: 'https://docs.linea.build/',
  elementName: ElementName.ChainLinea,
  explorer: {
    name: 'Lineascan',
    url: 'https://lineascan.build/',
  },
  interfaceName: 'linea',
  label: 'Linea',
  logo: LINEA_LOGO,
  nativeCurrency: {
    name: 'Linea ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  blockTimeMs: 2000,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  rpcUrls: {
    [RPCType.Public]: { http: [getUniRpcEndpointUrl(UniverseChainId.Linea)] },
    [RPCType.Default]: { http: ['https://rpc.linea.build'] },
    [RPCType.Interface]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.Linea)],
    },
  },
  tokens,
  statusPage: 'https://linea.statuspage.io/',
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1],
  supportsV4: true,
  supportsNFTs: true,
  urlParam: 'linea',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
  acrossProtocolAddress: '0x7E63A5f1a8F0B4d0934B2f2327DAED3F6bb2ee75',
} as const satisfies UniverseChainInfo
