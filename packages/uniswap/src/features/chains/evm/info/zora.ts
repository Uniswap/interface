import { GraphQLApi } from '@universe/api'
import { ETH_LOGO, ZORA_LOGO } from 'ui/src/assets'
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
import { zora } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4', UniverseChainId.Zora),
  },
})

export const ZORA_CHAIN_INFO = {
  ...zora,
  id: UniverseChainId.Zora,
  platform: Platform.EVM,
  assetRepoNetworkName: 'zora',
  backendChain: {
    chain: GraphQLApi.Chain.Zora as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1, // TODO: verify
  blockWaitMsBeforeWarning: 600000,
  bridge: 'https://bridge.zora.energy/',
  docs: 'https://docs.zora.co/',
  elementName: ElementName.ChainZora,
  explorer: {
    name: 'Zora Explorer',
    url: 'https://explorer.zora.energy/',
  },
  openseaName: 'zora',
  interfaceName: 'zora',
  label: 'Zora Network',
  logo: ZORA_LOGO,
  networkLayer: NetworkLayer.L2,
  nativeCurrency: {
    name: 'Zora ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Zora)] },
    [RPCType.Default]: { http: ['https://rpc.zora.energy/'] },
    [RPCType.Interface]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Zora)] },
  },
  tokens,
  statusPage: undefined,
  supportsV4: true,
  urlParam: 'zora',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
