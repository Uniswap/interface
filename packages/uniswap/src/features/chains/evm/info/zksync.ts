import { GraphQLApi } from '@universe/api'
import { ETH_LOGO, ZKSYNC_LOGO } from 'ui/src/assets'
import { DEFAULT_NATIVE_ADDRESS_LEGACY, getQuicknodeEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
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
import { buildUSDC } from 'uniswap/src/features/tokens/stablecoin'
import { zksync } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4', UniverseChainId.Zksync),
  },
})

export const ZKSYNC_CHAIN_INFO = {
  ...zksync,
  id: UniverseChainId.Zksync,
  platform: Platform.EVM,
  assetRepoNetworkName: 'zksync',
  backendChain: {
    chain: GraphQLApi.Chain.Zksync as GqlChainId,
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
  tokens,
  supportsV4: false,
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91',
  },
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
