import { ETHEREUM_LOGO, ETH_LOGO } from 'ui/src/assets'
import { DEFAULT_MS_BEFORE_WARNING, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import { NetworkLayer, RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { isInterface } from 'utilities/src/platform'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { defineChain } from 'viem'

const CITREA_TESTNET_RPC = 'https://rpc.testnet.citrea.xyz'
const CITREA_RPC_URLS = [CITREA_TESTNET_RPC]

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
    // Placeholder stablecoin for Citrea Testnet - will be updated with actual token addresses
    usdc: {
      name: 'USD Coin (Testnet)',
      symbol: 'USDC',
      decimals: 6,
      address: '0x0000000000000000000000000000000000000001', // Placeholder address
    },
  },
})

export const CITREA_TESTNET_INFO = {
  ...citreaTestnet,
  id: UniverseChainId.CitreaTestnet,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: 'CITREA_TESTNET' as const, // Custom chain ID for backend
    backendSupported: false,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: isInterface ? DEFAULT_MS_BEFORE_WARNING : ONE_MINUTE_MS,
  bridge: 'https://bridge.testnet.citrea.xyz',
  docs: 'https://docs.citrea.xyz',
  elementName: ElementName.ChainCitreaTestnet,
  explorer: {
    name: 'Citrea Explorer',
    url: 'https://explorer.testnet.citrea.xyz/',
    apiURL: 'https://explorer.testnet.citrea.xyz/api',
  },
  helpCenterUrl: 'https://docs.citrea.xyz',
  infoLink: 'https://citrea.xyz',
  interfaceName: 'citrea-testnet',
  label: 'Citrea Testnet',
  logo: ETHEREUM_LOGO, // Placeholder logo
  nativeCurrency: {
    name: 'Citrea Bitcoin',
    symbol: 'cBTC',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO, // Placeholder logo
  },
  networkLayer: NetworkLayer.L2,
  rpcUrls: {
    default: { http: CITREA_RPC_URLS },
    [RPCType.Interface]: { http: CITREA_RPC_URLS },
    [RPCType.Public]: { http: CITREA_RPC_URLS },
  },
  spotPriceStablecoinAmountOverride: undefined,
  stablecoins: tokens.stablecoins,
  statusPage: undefined,
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
  pendingTransactionsRetryOptions: undefined,
} as const
