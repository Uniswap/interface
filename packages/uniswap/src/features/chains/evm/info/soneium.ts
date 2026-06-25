import { Token } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { isWebApp } from '@universe/environment'
import { ETH_LOGO, SONEIUM_LOGO } from 'ui/src/assets'
import { CHAIN_ID_TO_URL_PARAM } from 'uniswap/src/features/chains/chainUrlParam'
import {
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
import { soneium } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    // Soneium USDCE has non standard symbol and name
    USDC: new Token(
      UniverseChainId.Soneium,
      '0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369',
      6,
      'USDCE',
      'Soneium Bridged USDC',
    ),
  },
})

export const SONEIUM_CHAIN_INFO = {
  ...soneium,
  id: UniverseChainId.Soneium,
  platform: Platform.EVM,
  assetRepoNetworkName: 'soneium',
  backendChain: {
    chain: GraphQLApi.Chain.Soneium as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: isWebApp ? 1500000 : 1200000,
  bridge: 'https://superbridge.app/soneium',
  docs: 'https://docs.soneium.org/',
  elementName: ElementName.ChainSoneium,
  explorer: {
    name: 'Blockscout',
    url: 'https://soneium.blockscout.com/',
  },
  openseaName: 'soneium',
  interfaceName: 'soneium',
  searchAliases: ['sony', 'sonieum'],
  label: 'Soneium',
  logo: SONEIUM_LOGO,
  nativeCurrency: {
    name: 'Soneium ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  blockTimeMs: 2000,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  rpcUrls: {
    [RPCType.Public]: { http: [getUniRpcEndpointUrl(UniverseChainId.Soneium)] },
    [RPCType.Default]: { http: ['https://rpc.soneium.org'] },
    [RPCType.Interface]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.Soneium)],
    },
  },
  tokens,
  statusPage: 'https://status.soneium.org/',
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1],
  supportsV4: true,
  supportsNFTs: true,
  urlParam: CHAIN_ID_TO_URL_PARAM[UniverseChainId.Soneium],
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
  acrossProtocolAddress: '0x3baD7AD0728f9917d1Bf08af5782dCbD516cDd96',
} as const satisfies UniverseChainInfo
