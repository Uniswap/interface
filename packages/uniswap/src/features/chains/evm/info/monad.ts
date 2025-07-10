import { CurrencyAmount } from '@uniswap/sdk-core'
import { MONAD_LOGO } from 'ui/src/assets'
import { USDT_MONAD_TESTNET } from 'uniswap/src/constants/tokens'
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

export const MONAD_CHAIN_INFO = {
  id: UniverseChainId.MonadTestnet,
  testnet: true,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: BackendChainId.MonadTestnet as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  bridge: undefined,
  docs: 'https://docs.monad.xyz/',
  label: 'Monad Testnet',
  logo: MONAD_LOGO,
  name: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: MONAD_LOGO,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  statusPage: undefined,
  supportsV4: false,
  urlParam: 'monad_testnet',
  rpcUrls: {
    [RPCType.Public]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.MonadTestnet)],
    },
    [RPCType.Default]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.MonadTestnet)],
    },
    [RPCType.Interface]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.MonadTestnet)],
    },
  },
  wrappedNativeCurrency: {
    name: 'Wrapped Monad',
    symbol: 'WMON',
    decimals: 18,
    address: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701',
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  elementName: ElementName.ChainMonadTestnet,
  explorer: {
    name: 'Monad Explorer',
    url: 'https://testnet.monadexplorer.com/',
  },
  interfaceName: 'monad',
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDT_MONAD_TESTNET, 10_000e6),
  stablecoins: [USDT_MONAD_TESTNET],
} as const satisfies UniverseChainInfo
