import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { ETH_LOGO, WORLD_CHAIN_LOGO } from 'ui/src/assets'
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

const tokens = buildChainTokens({
  stables: {
    // Worldchain USDC.e has non standard symbol and name
    USDC: new Token(
      UniverseChainId.WorldChain,
      '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
      6,
      'USDC.e',
      'Bridged USDC',
    ),
  },
})

export const WORLD_CHAIN_INFO = {
  // ...worldChain,
  name: 'World Chain',
  id: UniverseChainId.WorldChain,
  platform: Platform.EVM,
  assetRepoNetworkName: 'worldcoin',
  backendChain: {
    chain: GraphQLApi.Chain.Worldchain as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1, // TODO: verify
  blockWaitMsBeforeWarning: undefined,
  bridge: 'https://world-chain.superbridge.app/app',
  docs: 'https://docs.worldcoin.org/',
  elementName: ElementName.ChainWorldChain,
  explorer: {
    name: 'World Chain Mainnet Explorer',
    url: 'https://worldscan.org/',
  },
  interfaceName: 'worldchain',
  label: 'World Chain',
  logo: WORLD_CHAIN_LOGO,
  nativeCurrency: {
    name: 'World Chain ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.WorldChain)],
    },
    [RPCType.Default]: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] },
    [RPCType.Interface]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.WorldChain)],
    },
  },
  urlParam: 'worldchain',
  statusPage: undefined,
  tokens,
  supportsV4: true,
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  testnet: false,
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
