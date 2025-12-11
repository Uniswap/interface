import { GraphQLApi } from '@universe/api'
import { ARBITRUM_LOGO, ETH_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
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
import { buildDAI, buildUSDC, buildUSDT } from 'uniswap/src/features/tokens/stablecoin'
import { arbitrum } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0xaf88d065e77c8cC2239327C5EDb3A432268e5831', UniverseChainId.ArbitrumOne),
    USDT: buildUSDT('0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', UniverseChainId.ArbitrumOne),
    DAI: buildDAI('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', UniverseChainId.ArbitrumOne),
  },
})

export const ARBITRUM_CHAIN_INFO = {
  ...arbitrum,
  id: UniverseChainId.ArbitrumOne,
  platform: Platform.EVM,
  assetRepoNetworkName: 'arbitrum',
  backendChain: {
    chain: GraphQLApi.Chain.Arbitrum as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 46,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  bridge: 'https://bridge.arbitrum.io/',
  docs: 'https://offchainlabs.com/',
  elementName: ElementName.ChainArbitrum,
  explorer: {
    name: 'Arbiscan',
    url: 'https://arbiscan.io/',
    apiURL: 'https://api.arbiscan.io',
  },
  openseaName: 'arbitrum',
  interfaceName: 'arbitrum',
  label: 'Arbitrum',
  logo: ARBITRUM_LOGO,
  nativeCurrency: {
    name: 'Arbitrum ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    explorerLink: 'https://arbiscan.io/chart/etherprice',
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  tokens,
  statusPage: undefined,
  supportsV4: true,
  supportsNFTs: true,
  urlParam: 'arbitrum',
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.ArbitrumOne)] },
    [RPCType.Default]: { http: ['https://arb1.arbitrum.io/rpc'] },
    [RPCType.Fallback]: { http: ['https://arbitrum.public-rpc.com'] },
    [RPCType.Interface]: {
      http: [
        `https://arbitrum-mainnet.infura.io/v3/${config.infuraKey}`,
        getQuicknodeEndpointUrl(UniverseChainId.ArbitrumOne),
      ],
    },
    [RPCType.PublicAlt]: { http: ['https://arb1.arbitrum.io/rpc'] },
  },
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 150,
  acrossProtocolAddress: '0xe35e9842fceaca96570b734083f4a58e8f7c5f2a',
} as const satisfies UniverseChainInfo
