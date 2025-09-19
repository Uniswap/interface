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
import { buildCUSD } from 'uniswap/src/features/tokens/stablecoin'
import { defineChain } from 'viem'

const testnetTokens = buildChainTokens({
  stables: {
    USDC: buildCUSD('0x2fFC18aC99D367b70dd922771dF8c2074af4aCE0', UniverseChainId.CitreaTestnet ),
  },
})


const citreaTestnet = defineChain({
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
})

export const CITREA_TESTNET_CHAIN_INFO = {
  ...citreaTestnet,
  id: UniverseChainId.CitreaTestnet,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: BackendChainId.UnknownChain as GqlChainId,
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
  supportsV4: false,
  urlParam: 'citrea_testnet',
  wrappedNativeCurrency: {
    name: 'Wrapped Citrea BTC',
    symbol: 'WcBTC',
    decimals: 18,
    address: '0x4370e27F7d91D9341bFf232d7Ee8bdfE3a9933a0',
  },
  tradingApiPollingIntervalMs: 500,
} as const satisfies UniverseChainInfo
