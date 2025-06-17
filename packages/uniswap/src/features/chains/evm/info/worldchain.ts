// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CurrencyAmount, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import { ETH_LOGO, WORLD_CHAIN_LOGO } from 'ui/src/assets'
import { USDC_WORLD_CHAIN } from 'uniswap/src/constants/tokens'
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

export const WORLD_CHAIN_INFO = {
  // ...worldChain,
  name: 'World Chain',
  id: UniverseChainId.WorldChain,
  sdkId: UniswapSDKChainId.WORLDCHAIN,
  assetRepoNetworkName: 'worldcoin',
  backendChain: {
    chain: BackendChainId.Worldchain as GqlChainId,
    backendSupported: true,
    isSecondaryChain: false,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1, // TODO: verify
  blockWaitMsBeforeWarning: undefined,
  bridge: 'https://world-chain.superbridge.app/app',
  docs: 'https://docs.worldcoin.org/',
  elementName: ElementName.ChainWorldChain,
  explorer: {
    name: 'World Chain Explorer',
    url: 'https://worldchain-mainnet.explorer.alchemy.com/',
  },
  helpCenterUrl: undefined,
  infoLink: 'https://app.uniswap.org/explore/tokens/ethereum/0x163f8c2467924be0ae7b5347228cabf260318753',
  infuraPrefix: undefined,
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
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_WORLD_CHAIN, 10_000e6),
  stablecoins: [USDC_WORLD_CHAIN],
  supportsInterfaceClientSideRouting: false,
  supportsGasEstimates: false,
  supportsV4: true,
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  testnet: false,
} as const satisfies UniverseChainInfo
