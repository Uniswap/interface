import { GraphQLApi } from '@universe/api'
import { ETH_LOGO, OPTIMISM_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import {
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
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
import { buildDAI, buildUSDC, buildUSDT } from 'uniswap/src/features/tokens/stablecoin'
import { isWebApp } from 'utilities/src/platform'
import { optimism } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', UniverseChainId.Optimism),
    USDT: buildUSDT('0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', UniverseChainId.Optimism),
    DAI: buildDAI('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', UniverseChainId.Optimism),
  },
})

export const OPTIMISM_CHAIN_INFO = {
  ...optimism,
  id: UniverseChainId.Optimism,
  platform: Platform.EVM,
  assetRepoNetworkName: 'optimism',
  backendChain: {
    chain: GraphQLApi.Chain.Optimism as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: isWebApp ? 1500000 : 1200000,
  bridge: 'https://app.optimism.io/bridge',
  docs: 'https://optimism.io/',
  elementName: ElementName.ChainOptimism,
  explorer: {
    name: 'OP Etherscan',
    url: 'https://optimistic.etherscan.io/',
    apiURL: 'https://api-optimistic.etherscan.io',
  },
  openseaName: 'optimism',
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
  tokens,
  statusPage: 'https://optimism.io/status',
  supportsV4: true,
  urlParam: 'optimism',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  tradingApiPollingIntervalMs: 200,
} as const satisfies UniverseChainInfo
