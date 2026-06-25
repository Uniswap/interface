import { Token } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { ETH_LOGO, MEGAETH_LOGO } from 'ui/src/assets'
import { CHAIN_ID_TO_URL_PARAM } from 'uniswap/src/features/chains/chainUrlParam'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  getQuicknodeEndpointUrl,
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
    USDM: new Token(UniverseChainId.MegaETH, '0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7', 18, 'USDM', 'USDM'),
    USDe: new Token(UniverseChainId.MegaETH, '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34', 18, 'USDe', 'USDe'),
  },
  primaryStablecoin: 'USDM',
})

export const MEGAETH_CHAIN_INFO = {
  id: UniverseChainId.MegaETH,
  platform: Platform.EVM,
  testnet: false,
  assetRepoNetworkName: 'megaeth',
  backendChain: {
    chain: GraphQLApi.Chain.Megaeth as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  bridge: 'https://rabbithole.megaeth.com/bridge',
  docs: 'https://docs.megaeth.com/',
  elementName: ElementName.ChainMegaETH,
  explorer: {
    name: 'MegaETH Blockscout',
    url: 'https://megaeth.blockscout.com/',
  },
  interfaceName: 'megaeth',
  label: 'MegaETH',
  logo: MEGAETH_LOGO,
  name: 'MegaETH',
  nativeCurrency: {
    name: 'MegaETH ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  blockTimeMs: 1000,
  subblockTimeMs: 10,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getUniRpcEndpointUrl(UniverseChainId.MegaETH)] },
    [RPCType.Default]: { http: ['https://mainnet.megaeth.com/rpc'] },
    [RPCType.Interface]: { http: [getQuicknodeEndpointUrl(UniverseChainId.MegaETH)] },
  },
  statusPage: 'https://uptime.megaeth.com/',
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1],
  supportsV4: true,
  supportsNFTs: true,
  tokens,
  urlParam: CHAIN_ID_TO_URL_PARAM[UniverseChainId.MegaETH],
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
