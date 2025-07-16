import { CurrencyAmount } from '@uniswap/sdk-core'
import { ETH_LOGO, SONEIUM_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { USDC_SONEIUM } from 'uniswap/src/constants/tokens'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { DEFAULT_NATIVE_ADDRESS_LEGACY, DEFAULT_RETRY_OPTIONS } from 'uniswap/src/features/chains/evm/rpc'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { isInterface } from 'utilities/src/platform'
import { soneium } from 'wagmi/chains'

export const SONEIUM_CHAIN_INFO = {
  ...soneium,
  id: UniverseChainId.Soneium,
  assetRepoNetworkName: 'soneium',
  backendChain: {
    chain: BackendChainId.Soneium as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: isInterface ? 1500000 : 1200000,
  bridge: 'https://superbridge.app/soneium',
  docs: 'https://docs.soneium.org/',
  elementName: ElementName.ChainSoneium,
  explorer: {
    name: 'Blockscout',
    url: 'https://soneium.blockscout.com/',
    apiURL: 'https://soneium.blockscout.com/api',
  },
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
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_SONEIUM, 10_000e6),
  stablecoins: [USDC_SONEIUM],
  statusPage: 'https://status.soneium.org/',
  supportsV4: true,
  urlParam: 'soneium',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
} as const satisfies UniverseChainInfo
