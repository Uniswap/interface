import { Token } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { ETH_LOGO, INK_LOGO } from 'ui/src/assets'
import { ALL_APPS_CHAIN_SUPPORTED_APPS } from 'uniswap/src/features/chains/chainAppSupport'
import { CHAIN_ID_TO_URL_PARAM } from 'uniswap/src/features/chains/chainUrlParam'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
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

const tokens = buildChainTokens({
  stables: {
    // USDT0 is the deepest USD stable on Ink by both Uniswap liquidity and holders, so it anchors pricing.
    USDT0: new Token(UniverseChainId.Ink, '0x0200C29006150606B650577BBE7B6248F58470c1', 6, 'USDT0', 'USDT0'),
    // Not buildUSDC: Ink USDC reports name "USDC", not the standard "USD Coin".
    USDC: new Token(UniverseChainId.Ink, '0x2D270e6886d130D724215A266106e6832161EAEd', 6, 'USDC', 'USDC'),
  },
  primaryStablecoin: 'USDT0',
})

export const INK_CHAIN_INFO = {
  id: UniverseChainId.Ink,
  platform: Platform.EVM,
  supportedApps: ALL_APPS_CHAIN_SUPPORTED_APPS,
  testnet: false,
  assetRepoNetworkName: 'ink',
  backendChain: {
    chain: GraphQLApi.Chain.Ink as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  bridge: 'https://superbridge.app/ink',
  docs: 'https://docs.inkonchain.com/',
  elementName: ElementName.ChainInk,
  explorer: {
    name: 'Blockscout',
    url: 'https://explorer.inkonchain.com/',
  },
  interfaceName: 'ink',
  label: 'Ink',
  logo: INK_LOGO,
  name: 'Ink',
  nativeCurrency: {
    name: 'Ink ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  blockTimeMs: 1000,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    // QuickNode has no Ink network, so Interface reads go through UniRPC alongside Public.
    [RPCType.Public]: { http: [getUniRpcEndpointUrl(UniverseChainId.Ink)] },
    [RPCType.Default]: { http: ['https://rpc-gel.inkonchain.com'] },
    [RPCType.Interface]: { http: [getUniRpcEndpointUrl(UniverseChainId.Ink)] },
  },
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1],
  supportsV4: true,
  supportsNFTs: true,
  tokens,
  urlParam: CHAIN_ID_TO_URL_PARAM[UniverseChainId.Ink],
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
