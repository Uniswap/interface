import { CurrencyAmount } from '@uniswap/sdk-core'
import { ETH_LOGO, OPTIMISM_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { DAI_OPTIMISM, USDC_OPTIMISM } from 'uniswap/src/constants/tokens'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
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
import { isInterface } from 'utilities/src/platform'
import { optimism } from 'wagmi/chains'

export const OPTIMISM_CHAIN_INFO = {
  ...optimism,
  id: UniverseChainId.Optimism,
  assetRepoNetworkName: 'optimism',
  backendChain: {
    chain: BackendChainId.Optimism as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: isInterface ? 1500000 : 1200000,
  bridge: 'https://app.optimism.io/bridge',
  docs: 'https://optimism.io/',
  elementName: ElementName.ChainOptimism,
  explorer: {
    name: 'OP Etherscan',
    url: 'https://optimistic.etherscan.io/',
    apiURL: 'https://api-optimistic.etherscan.io',
  },
  interfaceName: 'optimism',
  label: 'OP Mainnet',
  logo: OPTIMISM_LOGO,
  nativeCurrency: {
    name: 'Optimistic ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    explorerLink: 'https://optimistic.etherscan.io/chart/etherprice',
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Optimism)] },
    [RPCType.PublicAlt]: { http: ['https://mainnet.optimism.io'] },
    [RPCType.Default]: { http: ['https://mainnet.optimism.io/'] },
    [RPCType.Fallback]: { http: ['https://rpc.ankr.com/optimism'] },
    [RPCType.Interface]: { http: [`https://optimism-mainnet.infura.io/v3/${config.infuraKey}`] },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_OPTIMISM, 10_000e6),
  stablecoins: [USDC_OPTIMISM, DAI_OPTIMISM],
  statusPage: 'https://optimism.io/status',
  supportsV4: true,
  urlParam: 'optimism',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
} as const satisfies UniverseChainInfo
