// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CurrencyAmount, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import { POLYGON_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { DAI_POLYGON, USDC_POLYGON } from 'uniswap/src/constants/tokens'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getQuicknodeEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { polygon } from 'wagmi/chains'

export const POLYGON_CHAIN_INFO = {
  ...polygon,
  id: UniverseChainId.Polygon,
  sdkId: UniswapSDKChainId.POLYGON,
  assetRepoNetworkName: 'polygon',
  blockPerMainnetEpochForChainId: 5,
  backendChain: {
    chain: BackendChainId.Polygon as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: '0x0000000000000000000000000000000000001010',
    isSecondaryChain: false,
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
  helpCenterUrl: undefined,
  infoLink: 'https://app.uniswap.org/explore/tokens/polygon',
  infuraPrefix: 'polygon-mainnet',
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
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_POLYGON, 10_000e6),
  stablecoins: [USDC_POLYGON, DAI_POLYGON],
  statusPage: undefined,
  supportsInterfaceClientSideRouting: true,
  supportsGasEstimates: true,
  supportsV4: true,
  urlParam: 'polygon',
  wrappedNativeCurrency: {
    name: 'Wrapped POL',
    symbol: 'WPOL',
    decimals: 18,
    address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  },
} as const satisfies UniverseChainInfo
