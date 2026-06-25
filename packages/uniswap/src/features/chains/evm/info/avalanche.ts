import { Token } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { SwapConfigKey } from '@universe/gating'
import { AVALANCHE_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { CHAIN_ID_TO_URL_PARAM } from 'uniswap/src/features/chains/chainUrlParam'
import { DEFAULT_NATIVE_ADDRESS_LEGACY, getUniRpcEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
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
import { buildUSDC, buildUSDT } from 'uniswap/src/features/tokens/stablecoin'
import { avalanche } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', UniverseChainId.Avalanche),
    USDT: buildUSDT('0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', UniverseChainId.Avalanche),
    // Dai has non-default symbol/name on Avalanche
    DAI: new Token(UniverseChainId.Avalanche, '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', 18, 'DAI.e', 'Dai.e Token'),
  },
})

export const AVALANCHE_CHAIN_INFO = {
  ...avalanche,
  id: UniverseChainId.Avalanche,
  platform: Platform.EVM,
  assetRepoNetworkName: 'avalanchec',
  backendChain: {
    chain: GraphQLApi.Chain.Avalanche as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: 600000,
  bridge: 'https://core.app/bridge/',
  docs: 'https://docs.avax.network/',
  elementName: ElementName.ChainAvalanche,
  explorer: {
    name: 'Snowtrace',
    url: 'https://snowtrace.io/',
  },
  openseaName: 'avalanche',
  interfaceName: 'avalanche',
  label: 'Avalanche',
  logo: AVALANCHE_LOGO,
  name: 'Avalanche C-Chain',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: AVALANCHE_LOGO,
  },
  networkLayer: NetworkLayer.L1,
  blockTimeMs: 2000,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getUniRpcEndpointUrl(UniverseChainId.Avalanche)] },
    [RPCType.Default]: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    [RPCType.Interface]: { http: [`https://avalanche-mainnet.infura.io/v3/${config.infuraKey}`] },
  },
  tokens,
  statusPage: undefined,
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1],
  supportsV4: true,
  supportsNFTs: true,
  urlParam: CHAIN_ID_TO_URL_PARAM[UniverseChainId.Avalanche],
  wrappedNativeCurrency: {
    name: 'Wrapped AVAX',
    symbol: 'WAVAX',
    decimals: 18,
    address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
  },
  gasConfig: {
    send: {
      configKey: SwapConfigKey.AvalancheSendMinGasAmount,
      default: 25, // .0025 AVAX
    },
    swap: {
      configKey: SwapConfigKey.AvalancheSwapMinGasAmount,
      default: 200, // .02 AVAX
    },
  },
  tradingApiPollingIntervalMs: 200,
} as const satisfies UniverseChainInfo
