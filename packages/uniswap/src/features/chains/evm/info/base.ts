import { CurrencyAmount } from '@uniswap/sdk-core'
import { BASE_LOGO, ETH_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { USDC_BASE } from 'uniswap/src/constants/tokens'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
  getPlaywrightRpcUrls,
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
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isInterface } from 'utilities/src/platform'
import { base } from 'wagmi/chains'

const LOCAL_BASE_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8546'

export const BASE_CHAIN_INFO = {
  ...base,
  id: UniverseChainId.Base,
  backendChain: {
    chain: BackendChainId.Base as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: isInterface ? 1500000 : 600000,
  bridge: 'https://bridge.base.org/deposit',
  docs: 'https://docs.base.org/docs/',
  elementName: ElementName.ChainBase,
  explorer: {
    name: 'BaseScan',
    url: 'https://basescan.org/',
    apiURL: 'https://api.basescan.org',
  },
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
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_BASE, 10_000e6),
  assetRepoNetworkName: 'base',
  stablecoins: [USDC_BASE],
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
} as const satisfies UniverseChainInfo
