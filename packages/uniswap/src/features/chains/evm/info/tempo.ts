import { Token } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { SwapConfigKey } from '@universe/gating'
import { TEMPO_LOGO } from 'ui/src/assets'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS,
  getQuicknodeEndpointUrl,
  getUniRpcEndpointUrl,
} from 'uniswap/src/features/chains/evm/rpc'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import { NetworkLayer, RPCType, UniverseChainId, UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const PATHUSD_ADDRESS = '0x20c0000000000000000000000000000000000000'
const USDC_E_ADDRESS = '0x20c000000000000000000000b9537d11c60e8b50'

const tempoTokens = buildChainTokens({
  stables: {
    pathUSD: new Token(UniverseChainId.Tempo, PATHUSD_ADDRESS, 6, 'pathUSD', 'pathUSD'),
    'USDC.e': new Token(UniverseChainId.Tempo, USDC_E_ADDRESS, 6, 'USDC.e', 'Bridged USDC (Stargate)'),
  },
})

export const TEMPO_CHAIN_INFO = {
  id: UniverseChainId.Tempo,
  platform: Platform.EVM,
  testnet: false,
  assetRepoNetworkName: 'tempo',
  backendChain: {
    chain: GraphQLApi.Chain.Tempo,
    backendSupported: true,
    // Virtual USD must never be indexed as a portfolio balance
    nativeTokenBackendAddress: undefined,
  },
  bridge: 'https://www.bungee.exchange/',
  docs: 'https://docs.tempo.xyz/',
  label: 'Tempo',
  logo: TEMPO_LOGO,
  name: 'Tempo',
  // Virtual "USD" native currency placeholder.
  // Tempo has no native gas token — gas is paid in pathUSD (or other USD stablecoins, but we don't support them yet).
  // eth_getBalance returns a large sentinel value (~4.2e75) on mainnet, not a real balance.
  // EVM opcodes BALANCE/SELFBALANCE return 0. Gas checks use pathUSD balance instead (see useChainGasToken).
  // This virtual token must NEVER appear in token selectors or be used in transactions.
  nativeCurrency: {
    name: 'USD',
    symbol: 'USD',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS,
    logo: TEMPO_LOGO,
  },
  wrappedNativeCurrency: null,
  // Tempo pays gas in pathUSD (6-decimal ERC-20), not a native token.
  gasTokenOverride: tempoTokens.pathUSD,
  networkLayer: NetworkLayer.L1,
  blockTimeMs: 500,
  pendingTransactionsRetryOptions: undefined,
  statusPage: undefined,
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1],
  supportsV4: true,
  supportsNFTs: false,
  urlParam: 'tempo',
  rpcUrls: {
    [RPCType.Public]: { http: [getUniRpcEndpointUrl(UniverseChainId.Tempo)] },
    [RPCType.Default]: { http: ['https://rpc.tempo.xyz'] },
    [RPCType.Interface]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Tempo)] },
  },

  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  elementName: ElementName.ChainTempo,
  explorer: {
    name: 'Tempo Explorer',
    url: 'https://explore.tempo.xyz/',
  },
  interfaceName: 'tempo',
  tokens: tempoTokens,
  tradingApiPollingIntervalMs: ONE_SECOND_MS / 2,
  gasConfig: {
    send: {
      configKey: SwapConfigKey.TempoSendMinGasAmount,
      default: 100, // .01 pathUSD
    },
    swap: {
      configKey: SwapConfigKey.TempoSwapMinGasAmount,
      default: 200, // .02 pathUSD
    },
  },
} as const satisfies UniverseChainInfo
