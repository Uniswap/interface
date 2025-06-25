import { CurrencyAmount } from '@uniswap/sdk-core'
import { BNB_LOGO } from 'ui/src/assets'
import { USDC_BNB } from 'uniswap/src/constants/tokens'
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
import { bsc } from 'wagmi/chains'

export const BNB_CHAIN_INFO = {
  ...bsc,
  id: UniverseChainId.Bnb,
  assetRepoNetworkName: 'smartchain',
  backendChain: {
    chain: BackendChainId.Bnb as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 4,
  blockWaitMsBeforeWarning: 600000,
  bridge: 'https://cbridge.celer.network/1/56',
  docs: 'https://docs.bnbchain.org/',
  elementName: ElementName.ChainBNB,
  explorer: {
    name: 'BscScan',
    url: 'https://bscscan.com/',
    apiURL: 'https://api.bscscan.com',
  },
  interfaceName: 'bnb',
  label: 'BNB Chain',
  logo: BNB_LOGO,
  name: 'BNB Smart Chain Mainnet',
  nativeCurrency: {
    name: 'Binance Coin',
    symbol: 'BNB',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: BNB_LOGO,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Bnb)] },
    [RPCType.Default]: { http: ['https://bsc-dataseed1.bnbchain.org'] },
    [RPCType.Interface]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Bnb)] },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_BNB, 100e18),
  stablecoins: [USDC_BNB],
  statusPage: undefined,
  supportsV4: true,
  urlParam: 'bnb',
  wrappedNativeCurrency: {
    name: 'Wrapped BNB',
    symbol: 'WBNB',
    decimals: 18,
    address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  },
} as const satisfies UniverseChainInfo
