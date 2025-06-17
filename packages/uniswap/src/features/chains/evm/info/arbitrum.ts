// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CurrencyAmount, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import { ARBITRUM_LOGO, ETH_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { DAI_ARBITRUM_ONE, USDC_ARBITRUM } from 'uniswap/src/constants/tokens'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
  getQuicknodeEndpointUrl,
} from 'uniswap/src/features/chains/evm/rpc'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { arbitrum } from 'wagmi/chains'

export const ARBITRUM_CHAIN_INFO = {
  ...arbitrum,
  id: UniverseChainId.ArbitrumOne,
  sdkId: UniswapSDKChainId.ARBITRUM_ONE,
  assetRepoNetworkName: 'arbitrum',
  backendChain: {
    chain: BackendChainId.Arbitrum as GqlChainId,
    backendSupported: true,
    isSecondaryChain: false,
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
  helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
  infoLink: 'https://app.uniswap.org/explore/tokens/arbitrum',
  infuraPrefix: 'arbitrum-mainnet',
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
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10_000e6),
  stablecoins: [USDC_ARBITRUM, DAI_ARBITRUM_ONE],
  statusPage: undefined,
  supportsInterfaceClientSideRouting: true,
  supportsGasEstimates: true,
  supportsV4: true,
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
} as const satisfies UniverseChainInfo
