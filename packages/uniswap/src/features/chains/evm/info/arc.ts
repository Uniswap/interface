import { Token } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { SwapConfigKey } from '@universe/gating'
import { ARC_LOGO } from 'ui/src/assets'
import { ALL_APPS_CHAIN_SUPPORTED_APPS } from 'uniswap/src/features/chains/chainAppSupport'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS,
  getUniRpcEndpointUrl,
} from 'uniswap/src/features/chains/evm/rpc'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// On Arc, USDC is both the native gas token (18-decimal native balance) and a
// 6-decimal ERC-20 over the same balance. We model the native asset with a
// placeholder address at 18 decimals, and the ERC-20 representation as a distinct
// 6-decimal token used for gas (gasTokenOverride), balances, and routing.
// Canonical Arc USDC ERC-20 (precompile) address.
const USDC_ERC20_ADDRESS = '0x3600000000000000000000000000000000000000'

const arcTokens = buildChainTokens({
  stables: {
    USDC: new Token(UniverseChainId.Arc, USDC_ERC20_ADDRESS, 6, 'USDC', 'USD Coin'),
  },
  primaryStablecoin: 'USDC',
})

// Arc quick-select / common-base tokens. Deliberately not in the stables above:
// EURC is euro-pegged and USYC is yield-bearing, so neither should back USD
// fiat conversion via getPrimaryStablecoin/getStablecoinsForChain.
export const USYC_ARC = new Token(UniverseChainId.Arc, '0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C', 6, 'USYC', 'USYC')

export const EURC_ARC = new Token(UniverseChainId.Arc, '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1', 6, 'EURC', 'EURC')

// Bridged wrapped ETH on Arc — a plain ERC-20, not the chain's wrapped native
// (Arc has no wrapped native; USDC is the native/gas asset).
export const WETH_ARC = new Token(
  UniverseChainId.Arc,
  '0x128cC466B61f542da60c70e3aA11c10e19B84EDB',
  18,
  'wETH',
  'Wrapped Ether',
)

export const CIRBTC_ARC = new Token(
  UniverseChainId.Arc,
  '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0',
  8,
  'cirBTC',
  'Circle Wrapped BTC',
)

export const ARC_CHAIN_INFO = {
  id: UniverseChainId.Arc,
  platform: Platform.EVM,
  supportedApps: ALL_APPS_CHAIN_SUPPORTED_APPS,
  testnet: false,
  assetRepoNetworkName: 'arc',
  backendChain: {
    chain: GraphQLApi.Chain.Arc as GqlChainId,
    backendSupported: true,
    // Arc's native USDC is a real, indexable balance — resolve it via the ERC-20 address.
    nativeTokenBackendAddress: USDC_ERC20_ADDRESS,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  docs: 'https://docs.arc.network/',
  elementName: ElementName.ChainArc,
  explorer: {
    name: 'Arcscan',
    url: 'https://explorer.arc.io/',
  },
  interfaceName: 'arc',
  label: 'Arc',
  logo: ARC_LOGO,
  name: 'Arc',
  // Native gas token is USDC (18-decimal native balance), not ETH.
  nativeCurrency: {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS,
    logo: ARC_LOGO,
  },
  // Arc pays gas in the 6-decimal ERC-20 USDC, not a native ETH token.
  gasTokenOverride: arcTokens.USDC,
  // No WETH-style wrapped native on Arc.
  wrappedNativeCurrency: null,
  networkLayer: NetworkLayer.L1,
  blockTimeMs: 480,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getUniRpcEndpointUrl(UniverseChainId.Arc)] },
    [RPCType.Default]: { http: ['https://rpc.arc.io'] },
    [RPCType.Interface]: { http: [getUniRpcEndpointUrl(UniverseChainId.Arc)] },
  },
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1],
  supportsV4: true,
  supportsNFTs: true,
  tokens: arcTokens,
  urlParam: 'arc',
  tradingApiPollingIntervalMs: ONE_SECOND_MS / 2,
  gasConfig: {
    send: {
      configKey: SwapConfigKey.ArcSendMinGasAmount,
      default: 100, // .0001 USDC (6-decimal units) — tune via Statsig
    },
    swap: {
      configKey: SwapConfigKey.ArcSwapMinGasAmount,
      default: 200, // .0002 USDC (6-decimal units) — tune via Statsig
    },
  },
} as const satisfies UniverseChainInfo
