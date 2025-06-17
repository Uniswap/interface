// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CurrencyAmount, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import { CELO_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { USDC_CELO } from 'uniswap/src/constants/tokens'
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
import { celo } from 'wagmi/chains'

export const CELO_CHAIN_INFO = {
  ...celo,
  id: UniverseChainId.Celo,
  sdkId: UniswapSDKChainId.CELO,
  assetRepoNetworkName: 'celo',
  backendChain: {
    chain: BackendChainId.Celo as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    isSecondaryChain: false,
  },
  blockPerMainnetEpochForChainId: 2,
  blockWaitMsBeforeWarning: 600000,
  bridge: 'https://www.portalbridge.com/#/transfer',
  docs: 'https://docs.celo.org/',
  elementName: ElementName.ChainCelo,
  explorer: {
    name: 'Celoscan',
    url: 'https://celoscan.io/',
    apiURL: 'https://api.celoscan.io',
  },
  helpCenterUrl: undefined,
  infoLink: 'https://app.uniswap.org/explore/tokens/celo',
  infuraPrefix: 'celo-mainnet',
  interfaceName: 'celo',
  label: 'Celo',
  logo: CELO_LOGO,
  name: 'Celo Mainnet',
  nativeCurrency: {
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18,
    address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    logo: CELO_LOGO,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_CELO, 10_000e18),
  stablecoins: [USDC_CELO],
  statusPage: undefined,
  supportsInterfaceClientSideRouting: true,
  supportsGasEstimates: true,
  supportsV4: false,
  urlParam: 'celo',
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Celo)] },
    [RPCType.Default]: { http: [`https://forno.celo.org`] },
    [RPCType.Interface]: { http: [`https://celo-mainnet.infura.io/v3/${config.infuraKey}`] },
  },
  wrappedNativeCurrency: {
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18,
    address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  },
} as const satisfies UniverseChainInfo
