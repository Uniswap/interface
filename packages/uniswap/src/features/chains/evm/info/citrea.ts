import { CITREA_LOGO } from 'ui/src/assets'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
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
import { buildUSDT } from 'uniswap/src/features/tokens/stablecoin'

const tokens = buildChainTokens({
  stables: {
    USDT: buildUSDT('0x0000000000000000000000000000000000000000', UniverseChainId.CitreaTestnet),
  },
})

export const CITREA_CHAIN_INFO = {
  id: UniverseChainId.CitreaTestnet,
  platform: Platform.EVM,
  testnet: true,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: BackendChainId.UnknownChain as GqlChainId,
    backendSupported: false,
    nativeTokenBackendAddress: undefined,
  },
  bridge: undefined,
  docs: 'https://docs.citrea.xyz/',
  label: 'Citrea Testnet',
  logo: CITREA_LOGO,
  name: 'Citrea Testnet',
  nativeCurrency: {
    name: 'Bitcoin',
    symbol: 'cBTC',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: CITREA_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  statusPage: undefined,
  supportsV4: false,
  urlParam: 'citrea_testnet',
  rpcUrls: {
    [RPCType.Public]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    [RPCType.Default]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
    [RPCType.Interface]: {
      http: ['https://rpc.testnet.citrea.xyz'],
    },
  },
  wrappedNativeCurrency: {
    name: 'Wrapped Bitcoin',
    symbol: 'WcBTC',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000',
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  elementName: ElementName.ChainCitreaTestnet,
  explorer: {
    name: 'Citrea Explorer',
    url: 'https://explorer.testnet.citrea.xyz/',
  },
  interfaceName: 'citrea',
  tokens,
  tradingApiPollingIntervalMs: 200,
} as const satisfies UniverseChainInfo