import { Token } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { ETH_LOGO, ROBINHOOD_LOGO } from 'ui/src/assets'
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
    USDG: new Token(
      UniverseChainId.Robinhood,
      '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
      6,
      'USDG',
      'Global Dollar',
    ),
  },
  primaryStablecoin: 'USDG',
})

export const ROBINHOOD_CHAIN_INFO = {
  id: UniverseChainId.Robinhood,
  platform: Platform.EVM,
  supportedApps: ALL_APPS_CHAIN_SUPPORTED_APPS,
  testnet: false,
  assetRepoNetworkName: 'robinhood',
  backendChain: {
    chain: GraphQLApi.Chain.Robinhood as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  bridge: 'https://portal.arbitrum.io/bridge?destinationChain=robinhood-chain',
  docs: 'https://docs.robinhood.com/chain/',
  elementName: ElementName.ChainRobinhood,
  explorer: {
    name: 'Robinhood Explorer',
    // TODO(SWAP-2703): swap to the mainnet explorer URL before launch (testnet placeholder).
    url: 'https://robinhoodchain.blockscout.com/',
  },
  interfaceName: 'robinhood',
  label: 'Robinhood Chain',
  logo: ROBINHOOD_LOGO,
  name: 'Robinhood Chain',
  nativeCurrency: {
    name: 'Robinhood ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  blockTimeMs: 100,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getUniRpcEndpointUrl(UniverseChainId.Robinhood)] },
    [RPCType.Default]: {
      http: ['https://rpc.mainnet.chain.robinhood.com/'],
    },
    [RPCType.Interface]: { http: [getUniRpcEndpointUrl(UniverseChainId.Robinhood)] },
  },
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1],
  supportsV4: true,
  supportsNFTs: true,
  tokens,
  urlParam: CHAIN_ID_TO_URL_PARAM[UniverseChainId.Robinhood],
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
