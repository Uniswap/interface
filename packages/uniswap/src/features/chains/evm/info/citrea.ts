import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { CITREA_LOGO, DAI_LOGO, USDC_LOGO } from 'ui/src/assets'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
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

// Citrea uses BTC as the native currency but rebranded as cBTC
const BTC_LOGO = CITREA_LOGO

// Define Citrea Testnet tokens manually
const CITREA_USDC = new Token(
  UniverseChainId.CitreaTestnet,
  '0x1234567890123456789012345678901234567890', // Placeholder - replace with actual USDC contract address
  6,
  'USDC',
  'USD Coin',
  USDC_LOGO,
)

const CITREA_WUSDT = new Token(
  UniverseChainId.CitreaTestnet,
  '0x2345678901234567890123456789012345678901', // Placeholder - replace with actual wUSDT contract address
  6,
  'wUSDT',
  'Wrapped Tether USD',
  DAI_LOGO, // Using DAI logo as placeholder for USDT
)

// Native cBTC token (similar to wrapped ETH)
const CITREA_CBTC = new Token(
  UniverseChainId.CitreaTestnet,
  DEFAULT_NATIVE_ADDRESS_LEGACY, // Native token address
  18,
  'cBTC',
  'Citrea BTC',
  BTC_LOGO,
)

const testnetTokens = buildChainTokens({
  stables: {
    USDC: CITREA_USDC,
    USDT: CITREA_WUSDT,
  },
})

// Define Citrea chain configuration similar to wagmi chain format
const citreaTestnet = {
  id: UniverseChainId.CitreaTestnet,
  name: 'Citrea Testnet',
  network: 'citrea-testnet',
  nativeCurrency: {
    name: 'Citrea BTC',
    symbol: 'cBTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    public: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Citrea Testnet Explorer',
      url: 'https://explorer.testnet.citrea.xyz',
      apiUrl: 'https://explorer.testnet.citrea.xyz/api',
    },
  },
  contracts: {},
  testnet: true,
} as const

export const CITREA_TESTNET_CHAIN_INFO = {
  ...citreaTestnet,
  id: UniverseChainId.CitreaTestnet,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: BackendChainId.UnknownChain as GqlChainId, // Citrea is not yet supported in backend
    backendSupported: false,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  bridge: undefined,
  docs: 'https://docs.citrea.xyz/',
  elementName: ElementName.ChainCitreaTestnet,
  explorer: {
    name: 'Citrea Testnet Explorer',
    url: 'https://explorer.testnet.citrea.xyz/',
    apiURL: 'https://explorer.testnet.citrea.xyz/api',
  },
  interfaceName: 'citrea_testnet',
  label: 'Citrea Testnet',
  logo: CITREA_LOGO,
  nativeCurrency: {
    name: 'Citrea BTC',
    symbol: 'cBTC',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    explorerLink: 'https://explorer.testnet.citrea.xyz/',
    logo: CITREA_LOGO,
  },
  networkLayer: NetworkLayer.L2, // Citrea is a Bitcoin rollup (L2)
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    [RPCType.Default]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    [RPCType.Fallback]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    [RPCType.Interface]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
  },
  spotPriceStablecoinAmountOverride: CurrencyAmount.fromRawAmount(testnetTokens.USDC, 100e6),
  tokens: testnetTokens,
  statusPage: undefined,
  supportsV4: false, // Assume V4 is not supported on Citrea yet
  urlParam: 'citrea_testnet',
  wrappedNativeCurrency: {
    name: 'Wrapped Citrea BTC',
    symbol: 'WcBTC',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Placeholder address
  },
  tradingApiPollingIntervalMs: 500,
} as const satisfies UniverseChainInfo
