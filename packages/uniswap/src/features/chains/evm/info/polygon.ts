import { GraphQLApi } from '@universe/api'
import { SwapConfigKey } from '@universe/gating'
import { POLYGON_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { getQuicknodeEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
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
import { buildDAI, buildUSDC, buildUSDT } from 'uniswap/src/features/tokens/stablecoin'
import { polygon } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', UniverseChainId.Polygon),
    USDT: buildUSDT('0xc2132d05d31c914a87c6611c10748aeb04b58e8f', UniverseChainId.Polygon),
    DAI: buildDAI('0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', UniverseChainId.Polygon),
  },
})

export const POLYGON_CHAIN_INFO = {
  ...polygon,
  id: UniverseChainId.Polygon,
  platform: Platform.EVM,
  assetRepoNetworkName: 'polygon',
  blockPerMainnetEpochForChainId: 5,
  backendChain: {
    chain: GraphQLApi.Chain.Polygon as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: '0x0000000000000000000000000000000000001010',
  },
  blockWaitMsBeforeWarning: 600000,
  bridge: 'https://portal.polygon.technology/bridge',
  docs: 'https://polygon.io/',
  elementName: ElementName.ChainPolygon,
  explorer: {
    name: 'PolygonScan',
    url: 'https://polygonscan.com/',
    apiURL: 'https://api.polygonscan.com',
  },
  openseaName: 'matic',
  interfaceName: 'polygon',
  label: 'Polygon',
  logo: POLYGON_LOGO,
  name: 'Polygon Mainnet',
  nativeCurrency: {
    name: 'Polygon POL',
    symbol: 'POL',
    decimals: 18,
    address: '0x0000000000000000000000000000000000001010',
    logo: POLYGON_LOGO,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Polygon)] },
    [RPCType.PublicAlt]: { http: ['https://polygon-rpc.com/'] },
    [RPCType.Default]: { http: ['https://polygon-rpc.com/'] },
    [RPCType.Interface]: { http: [`https://polygon-mainnet.infura.io/v3/${config.infuraKey}`] },
  },
  tokens,
  statusPage: undefined,
  supportsV4: true,
  urlParam: 'polygon',
  wrappedNativeCurrency: {
    name: 'Wrapped POL',
    symbol: 'WPOL',
    decimals: 18,
    address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  },
  gasConfig: {
    send: {
      configKey: SwapConfigKey.PolygonSendMinGasAmount,
      default: 75, // .0075 MATIC
    },
    swap: {
      configKey: SwapConfigKey.PolygonSwapMinGasAmount,
      default: 600, // .06 MATIC
    },
  },
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
