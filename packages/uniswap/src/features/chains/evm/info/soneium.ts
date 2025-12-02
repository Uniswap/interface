import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { ETH_LOGO, SONEIUM_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { DEFAULT_NATIVE_ADDRESS_LEGACY, DEFAULT_RETRY_OPTIONS } from 'uniswap/src/features/chains/evm/rpc'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import { GENERIC_L2_GAS_CONFIG } from 'uniswap/src/features/chains/gasDefaults'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { isWebApp } from 'utilities/src/platform'
import { soneium } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    // Soneium USDCE has non standard symbol and name
    USDC: new Token(
      UniverseChainId.Soneium,
      '0xbA9986D2381edf1DA03B0B9c1f8b00dc4AacC369',
      6,
      'USDCE',
      'Soneium Bridged USDC',
    ),
  },
})

export const SONEIUM_CHAIN_INFO = {
  ...soneium,
  id: UniverseChainId.Soneium,
  platform: Platform.EVM,
  assetRepoNetworkName: 'soneium',
  backendChain: {
    chain: GraphQLApi.Chain.Soneium as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: isWebApp ? 1500000 : 1200000,
  bridge: 'https://superbridge.app/soneium',
  docs: 'https://docs.soneium.org/',
  elementName: ElementName.ChainSoneium,
  explorer: {
    name: 'Blockscout',
    url: 'https://soneium.blockscout.com/',
    apiURL: 'https://soneium.blockscout.com/api',
  },
  openseaName: 'soneium',
  interfaceName: 'soneium',
  label: 'Soneium',
  logo: SONEIUM_LOGO,
  nativeCurrency: {
    name: 'Soneium ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  rpcUrls: {
    // TODO (WEB-6702) - update public rpc to quicknode url when available
    [RPCType.Public]: { http: [`https://soneium-mainnet.g.alchemy.com/v2/${config.alchemyApiKey}`] },
    [RPCType.Default]: { http: ['https://rpc.soneium.org'] },
    [RPCType.Interface]: { http: [`https://soneium-mainnet.g.alchemy.com/v2/${config.alchemyApiKey}`] },
  },
  tokens,
  statusPage: 'https://status.soneium.org/',
  supportsV4: true,
  urlParam: 'soneium',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
