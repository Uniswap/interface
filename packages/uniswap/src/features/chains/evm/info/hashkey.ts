import { GraphQLApi } from '@universe/api'
import { HSK_LOGO, HASHKEY_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import {
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  getPlaywrightRpcUrls,
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
import { buildUSDC, buildUSDT } from 'uniswap/src/features/tokens/stablecoin'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isWebApp } from 'utilities/src/platform'
import { DEFAULT_MS_BEFORE_WARNING } from 'uniswap/src/features/chains/evm/rpc'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

// HashKey Chain Mainnet tokens
const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x93F960a8DAB5A541e93e6DdaCD54F49a1750DE81', UniverseChainId.HashKey),
    USDT: buildUSDT('0xc52Cd4E787686A6130e1A982576e815A76e12024', UniverseChainId.HashKey),
  },
})

const LOCAL_HASHKEY_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8547'

export const HASHKEY_CHAIN_INFO = {
  name: 'HashKey Chain',
  id: UniverseChainId.HashKey,
  blockExplorers: {
    default: {
      name: 'HashKey Explorer',
      url: 'https://hashkey.blockscout.com',
    },
  },
  testnet: false,
  platform: Platform.EVM,
  assetRepoNetworkName: 'hashkey',
  backendChain: {
    chain: GraphQLApi.Chain.Hashkey as GqlChainId, // Use Hashkey as fallback until HashKey is added to GraphQL API
    backendSupported: false, // Set to true when backend supports HashKey
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6, // L2 chains typically have faster block times
  blockWaitMsBeforeWarning: isWebApp ? DEFAULT_MS_BEFORE_WARNING : ONE_MINUTE_MS,
  bridge: 'https://bridge.hashkeychain.net/',
  docs: 'https://docs.hashkeychain.net/',
  elementName: ElementName.ChainHashKey,
  explorer: {
    name: 'HashKey Explorer',
    url: 'https://hashkey.blockscout.com/',
  },
  interfaceName: 'hashkey',
  label: 'HashKey Chain',
  logo: HASHKEY_LOGO, // Use Ethereum logo as placeholder, replace with HashKey logo when available
  nativeCurrency: {
    name: 'HashKey Platform Token',
    symbol: 'HSK',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: HSK_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: isPlaywrightEnv()
    ? getPlaywrightRpcUrls(LOCAL_HASHKEY_PLAYWRIGHT_RPC_URL)
    : {
        [RPCType.Public]: {
          http: ['https://mainnet.hsk.xyz'],
        },
        [RPCType.Default]: {
          http: ['https://mainnet.hsk.xyz'],
        },
        [RPCType.Fallback]: {
          http: ['https://mainnet.hsk.xyz'],
        },
        [RPCType.Interface]: {
          http: ['https://mainnet.hsk.xyz'],
        },
      },
  urlParam: 'hashkey',
  statusPage: undefined,
  tokens,
  supportsV4: false,
  supportsNFTs: true,
  wrappedNativeCurrency: {
    name: 'Wrapped HashKey',
    symbol: 'WHSK',
    decimals: 18,
    address: '0xCA8aAceEC5Db1e91B9Ed3a344bA026c4a2B3ebF6', // Standard OP-Stack WETH address
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 150,
} as const satisfies UniverseChainInfo

// HashKey Chain Testnet tokens
const testnetTokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x93F960a8DAB5A541e93e6DdaCD54F49a1750DE81', UniverseChainId.HashKeyTestnet),
    USDT: buildUSDT('0xc52Cd4E787686A6130e1A982576e815A76e12024', UniverseChainId.HashKeyTestnet),
  },
})

export const HASHKEY_TESTNET_CHAIN_INFO = {
  name: 'HashKey Chain Testnet',
  id: UniverseChainId.HashKeyTestnet,
  blockExplorers: {
    default: {
      name: 'HashKey Testnet Explorer',
      url: 'https://testnet-explorer.hsk.xyz',
    },
  },
  testnet: true,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: GraphQLApi.Chain.HashkeyTestnet as GqlChainId, // Use HashKey Testnet as fallback
    backendSupported: false,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: undefined,
  bridge: undefined,
  docs: 'https://docs.hashkeychain.net/',
  elementName: ElementName.ChainHashKeyTestnet,
  explorer: {
    name: 'HashKey Testnet Explorer',
    url: 'https://testnet-explorer.hsk.xyz/',
  },
  interfaceName: 'hashkey-testnet',
  label: 'HashKey Testnet',
  logo: HASHKEY_LOGO,
  nativeCurrency: {
    name: 'HashKey Testnet Platform Token',
    symbol: 'HSK',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: HSK_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: {
      http: ['https://testnet.hsk.xyz'],
    },
    [RPCType.Default]: {
      http: ['https://testnet.hsk.xyz'],
    },
    [RPCType.Fallback]: {
      http: ['https://testnet.hsk.xyz'],
    },
    [RPCType.Interface]: {
      http: ['https://testnet.hsk.xyz'],
    },
  },
  urlParam: 'hashkey_testnet',
  statusPage: undefined,
  tokens: testnetTokens,
  supportsV4: false,
  supportsNFTs: false,
  wrappedNativeCurrency: {
    name: 'Wrapped HashKey',
    symbol: 'WHSK',
    decimals: 18,
    address: '0xCA8aAceEC5Db1e91B9Ed3a344bA026c4a2B3ebF6',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 150,
} as const satisfies UniverseChainInfo

