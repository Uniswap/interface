import { GraphQLApi } from '@universe/api'
import { BASE_LOGO, ETH_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import {
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
  getPlaywrightRpcUrls,
  getQuicknodeEndpointUrl,
} from 'uniswap/src/features/chains/evm/rpc'
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
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isWebApp } from 'utilities/src/platform'
import { base } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', UniverseChainId.Base),
  },
})

const LOCAL_BASE_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8546'

export const BASE_CHAIN_INFO = {
  ...base,
  id: UniverseChainId.Base,
  platform: Platform.EVM,
  backendChain: {
    chain: GraphQLApi.Chain.Base as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: isWebApp ? 1500000 : 600000,
  bridge: 'https://bridge.base.org/deposit',
  docs: 'https://docs.base.org/docs/',
  elementName: ElementName.ChainBase,
  explorer: {
    name: 'BaseScan',
    url: 'https://basescan.org/',
    apiURL: 'https://api.basescan.org',
  },
  openseaName: 'base',
  interfaceName: 'base',
  label: 'Base',
  logo: BASE_LOGO,
  nativeCurrency: {
    name: 'Base ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    explorerLink: 'https://basescan.org/chart/etherprice',
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  statusPage: 'https://status.base.org/',
  supportsV4: true,
  urlParam: 'base',
  rpcUrls: isPlaywrightEnv()
    ? getPlaywrightRpcUrls(LOCAL_BASE_PLAYWRIGHT_RPC_URL)
    : {
        [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Base)] },
        [RPCType.Default]: { http: ['https://mainnet.base.org/'] },
        [RPCType.Fallback]: { http: ['https://1rpc.io/base', 'https://base.meowrpc.com'] },
        [RPCType.Interface]: { http: [`https://base-mainnet.infura.io/v3/${config.infuraKey}`] },
      },
  assetRepoNetworkName: 'base',
  tokens,
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  tradingApiPollingIntervalMs: 150,
} as const satisfies UniverseChainInfo
