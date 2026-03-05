import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { OKB_LOGO, XLAYER_LOGO } from 'ui/src/assets'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
  getQuicknodeEndpointUrl,
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
import { buildUSDC } from 'uniswap/src/features/tokens/stablecoin'
import { xLayer } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDT0: new Token(UniverseChainId.XLayer, '0x779Ded0c9e1022225f8E0630b35a9b54bE713736', 6, 'USDT0', 'USDT0'),
    USDC: buildUSDC('0x74b7F16337b8972027F6196A17a631aC6dE26d22', UniverseChainId.XLayer),
  },
})

export const XLAYER_CHAIN_INFO = {
  ...xLayer,
  id: UniverseChainId.XLayer,
  platform: Platform.EVM,
  assetRepoNetworkName: 'xlayer',
  backendChain: {
    chain: GraphQLApi.Chain.Xlayer as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  bridge: 'https://web3.okx.com/xlayer/bridge',
  docs: 'https://web3.okx.com/xlayer/docs/developer/build-on-xlayer/about-xlayer',
  elementName: ElementName.ChainXLayer,
  explorer: {
    name: 'X Layer Explorer',
    url: 'https://web3.okx.com/explorer/x-layer/',
  },
  interfaceName: 'xlayer',
  label: 'X Layer',
  logo: XLAYER_LOGO,
  nativeCurrency: {
    name: 'OKB',
    symbol: 'OKB',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: OKB_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  blockTimeMs: 3000,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.XLayer)] },
    [RPCType.Default]: { http: [getQuicknodeEndpointUrl(UniverseChainId.XLayer)] },
    [RPCType.Interface]: { http: [getQuicknodeEndpointUrl(UniverseChainId.XLayer)] },
  },
  tokens,
  statusPage: undefined,
  supportsV4: true,
  supportsNFTs: true,
  urlParam: 'xlayer',
  wrappedNativeCurrency: {
    name: 'Wrapped OKB',
    symbol: 'WOKB',
    decimals: 18,
    address: '0xe538905cf8410324e03A5A23C1c177a474D59b2b',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
