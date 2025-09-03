import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
} from 'uniswap/src/features/chains/evm/rpc'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import {
  NetworkLayer,
  RPCType,
  UniverseChainId,
} from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { isInterface } from 'utilities/src/platform'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { defineChain } from 'viem'

const CITREA_TESTNET_RPC = 'https://rpc.testnet.citrea.xyz'

export const citreaTestnet = defineChain({
  id: UniverseChainId.CitreaTestnet,
  name: 'Citrea Testnet',
  nativeCurrency: {
    name: 'Citrea Bitcoin',
    symbol: 'cBTC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [CITREA_TESTNET_RPC] },
    public: { http: [CITREA_TESTNET_RPC] },
  },
  blockExplorers: {
    default: {
      name: 'Citrea Explorer',
      url: 'https://explorer.testnet.citrea.xyz',
      apiUrl: 'https://explorer.testnet.citrea.xyz/api',
    },
  },
  testnet: true,
})

const tokens = buildChainTokens({
  stables: {
    // Citrea testnet tokens will be added later
  },
})

export const CITREA_TESTNET_INFO = {
  ...citreaTestnet,
  id: UniverseChainId.CitreaTestnet,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: 'CITREA_TESTNET' as any, // Custom chain ID for backend (not in GQL schema yet)
    backendSupported: false,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: isInterface ? DEFAULT_MS_BEFORE_WARNING : ONE_MINUTE_MS,
  bridge: 'https://bridge.testnet.citrea.xyz',
  chainPriority: 11, // Low priority as testnet
  color: '#ff6f00', // Orange theme for JuiceSwap
  docs: 'https://docs.citrea.xyz',
  elementName: ElementName.ChainCitreaTestnet,
  explorer: {
    name: 'Citrea Explorer',
    url: 'https://explorer.testnet.citrea.xyz',
    apiURL: 'https://explorer.testnet.citrea.xyz/api',
  },
  helpCenterUrl: 'https://docs.citrea.xyz',
  infoLink: 'https://citrea.xyz',
  interfaceName: 'citrea-testnet',
  label: 'Citrea Testnet',
  logo: '/images/landing_page/citrea-logo.png',
  nativeCurrency: {
    name: 'Citrea Bitcoin',
    symbol: 'cBTC',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
  },
  networkLayer: NetworkLayer.L2,
  rpcUrls: {
    [RPCType.Interface]: { http: [CITREA_TESTNET_RPC] },
    [RPCType.Public]: { http: [CITREA_TESTNET_RPC] },
  },
  spotPriceStablecoinAmount: undefined,
  stablecoins: tokens.stablecoins,
  statusPage: undefined,
  symbol: 'cBTC',
  tokens,
  supportsV4: false, // V4 not supported on Citrea initially
  wrappedNativeCurrency: {
    name: 'Wrapped Citrea Bitcoin',
    symbol: 'WcBTC',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Placeholder address
  },
  testnet: true,
  tradingApiPollingIntervalMs: 500,
  urlParam: 'citrea-testnet',
  pendingTransactionsRetryOptions: {
    retryOptions: { retries: 3 },
  },
} as const