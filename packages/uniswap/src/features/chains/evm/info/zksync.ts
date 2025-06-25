import { CurrencyAmount } from '@uniswap/sdk-core'
import { ETH_LOGO, ZKSYNC_LOGO } from 'ui/src/assets'
import { USDC_ZKSYNC } from 'uniswap/src/constants/tokens'
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
import { zksync } from 'wagmi/chains'

export const ZKSYNC_CHAIN_INFO = {
  ...zksync,
  id: UniverseChainId.Zksync,
  assetRepoNetworkName: 'zksync',
  backendChain: {
    chain: BackendChainId.Zksync as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 12,
  blockWaitMsBeforeWarning: 600000,
  bridge: 'https://portal.zksync.io/bridge/',
  docs: 'https://docs.zksync.io/',
  elementName: ElementName.ChainZkSync,
  explorer: {
    name: 'ZKsync Explorer',
    url: 'https://explorer.zksync.io/',
    apiURL: 'https://block-explorer-api.mainnet.zksync.io',
  },
  interfaceName: 'zksync',
  label: 'ZKsync',
  logo: ZKSYNC_LOGO,
  nativeCurrency: {
    name: 'ZKsync ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Zksync)] },
    [RPCType.Default]: { http: ['https://mainnet.era.zksync.io/'] },
    [RPCType.Interface]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Zksync)] },
  },
  urlParam: 'zksync',
  statusPage: undefined,
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_ZKSYNC, 10_000e6),
  stablecoins: [USDC_ZKSYNC],
  supportsV4: false,
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
  },
} as const satisfies UniverseChainInfo
