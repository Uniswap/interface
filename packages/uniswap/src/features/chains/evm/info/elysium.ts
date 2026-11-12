import { Token } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { Platform, UniverseChainId } from '@universe/chains'
import { ELYSIUM_LOGO, HYPE_LOGO } from '@universe/mycelium/assets'
import { ALL_APPS_CHAIN_SUPPORTED_APPS } from 'uniswap/src/features/chains/chainAppSupport'
import { CHAIN_ID_TO_URL_PARAM } from 'uniswap/src/features/chains/chainUrlParam'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  getUniRpcEndpointUrl,
} from 'uniswap/src/features/chains/evm/rpc'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import { GENERIC_L2_GAS_CONFIG } from 'uniswap/src/features/chains/gasDefaults'
import { NetworkLayer, RPCType, UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

// Kinetiq Elysium (Arbitrum Orbit on HyperEVM, HYPE gas), not the unrelated Elysium chain 1339.

const tokens = buildChainTokens({
  stables: {
    USDC: new Token(UniverseChainId.Elysium, '0xb47c4C8F73F009CC0C0d3f92B388d13E293F0B65', 6, 'USDC', 'USDC'),
  },
  primaryStablecoin: 'USDC',
})

export const ELYSIUM_CHAIN_INFO = {
  id: UniverseChainId.Elysium,
  platform: Platform.EVM,
  supportedApps: ALL_APPS_CHAIN_SUPPORTED_APPS,
  testnet: false,
  assetRepoNetworkName: undefined,
  backendChain: {
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  bridge: 'https://elysium.kinetiq.xyz/bridge',
  docs: 'https://elysium.kinetiq.xyz/docs/connecting-to-elysium',
  elementName: ElementName.ChainElysium,
  explorer: { name: 'Elysium Explorer', url: 'https://elysium.kinetiq.xyz/explorer/' },
  interfaceName: 'elysium',
  label: 'Elysium',
  logo: ELYSIUM_LOGO,
  name: 'Elysium',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: HYPE_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  blockTimeMs: 250,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getUniRpcEndpointUrl(UniverseChainId.Elysium)] },
    [RPCType.Default]: { http: ['https://rpc.elysium.kinetiq.xyz'] },
    [RPCType.Interface]: { http: [getUniRpcEndpointUrl(UniverseChainId.Elysium)] },
  },
  // TODO(CONS-4055): confirm against universal-router#534 before enabling swaps
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_1_2, TradingApi.UniversalRouterVersion._2_2_0],
  supportsV4: true,
  supportsNFTs: false,
  tokens,
  urlParam: CHAIN_ID_TO_URL_PARAM[UniverseChainId.Elysium],
  // Verified onchain (ECO-1412); not HyperEVM's 0x5555…5555 wrapper
  wrappedNativeCurrency: {
    name: 'Wrapped HYPE',
    symbol: 'WHYPE',
    decimals: 18,
    address: '0xbA876237B0F021A6c6D852d6c26E107997cC5E81',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
