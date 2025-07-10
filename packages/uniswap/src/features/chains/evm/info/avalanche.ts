import { CurrencyAmount } from '@uniswap/sdk-core'
import { AVALANCHE_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { USDC_AVALANCHE } from 'uniswap/src/constants/tokens'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { DEFAULT_NATIVE_ADDRESS_LEGACY, getQuicknodeEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { avalanche } from 'wagmi/chains'

export const AVALANCHE_CHAIN_INFO = {
  ...avalanche,
  id: UniverseChainId.Avalanche,
  assetRepoNetworkName: 'avalanchec',
  backendChain: {
    chain: BackendChainId.Avalanche as GqlChainId,
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
    apiURL: 'https://api.snowscan.xyz',
  },
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
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Avalanche)] },
    [RPCType.Default]: { http: ['https://api.avax.network/ext/bc/C/rpc'] },
    [RPCType.Interface]: { http: [`https://avalanche-mainnet.infura.io/v3/${config.infuraKey}`] },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_AVALANCHE, 10_000e6),
  stablecoins: [USDC_AVALANCHE],
  statusPage: undefined,
  supportsV4: true,
  urlParam: 'avalanche',
  wrappedNativeCurrency: {
    name: 'Wrapped AVAX',
    symbol: 'WAVAX',
    decimals: 18,
    address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
  },
} as const satisfies UniverseChainInfo
