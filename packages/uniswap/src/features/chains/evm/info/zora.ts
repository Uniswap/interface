import { CurrencyAmount } from '@uniswap/sdk-core'
import { ETH_LOGO, ZORA_LOGO } from 'ui/src/assets'
import { USDC_ZORA } from 'uniswap/src/constants/tokens'
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
import { zora } from 'wagmi/chains'

export const ZORA_CHAIN_INFO = {
  ...zora,
  id: UniverseChainId.Zora,
  assetRepoNetworkName: 'zora',
  backendChain: {
    chain: BackendChainId.Zora as GqlChainId,
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
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_ZORA, 10_000e6),
  stablecoins: [USDC_ZORA],
  statusPage: undefined,
  supportsV4: true,
  urlParam: 'zora',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
} as const satisfies UniverseChainInfo
