import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { BNB_LOGO } from 'ui/src/assets'
import { DEFAULT_NATIVE_ADDRESS_LEGACY, getQuicknodeEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
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
import { bsc } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    // USDC on BNB has non-default decimals
    USDC: new Token(UniverseChainId.Bnb, '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 18, 'USDC', 'USD Coin'),
    // USDT on BNB has non-default decimals
    USDT: new Token(UniverseChainId.Bnb, '0x55d398326f99059ff775485246999027b3197955', 18, 'USDT', 'Tether USD'),
  },
})

export const BNB_CHAIN_INFO = {
  ...bsc,
  id: UniverseChainId.Bnb,
  platform: Platform.EVM,
  assetRepoNetworkName: 'smartchain',
  backendChain: {
    chain: GraphQLApi.Chain.Bnb as GqlChainId,
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
  spotPriceStablecoinAmountOverride: CurrencyAmount.fromRawAmount(tokens.USDC, 100e18),
  tokens,
  statusPage: undefined,
  supportsV4: true,
  supportsNFTs: false,
  urlParam: 'bnb',
  wrappedNativeCurrency: {
    name: 'Wrapped BNB',
    symbol: 'WBNB',
    decimals: 18,
    address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 200,
  acrossProtocolAddress: '0x4e8E101924eDE233C13e2D8622DC8aED2872d505',
} as const satisfies UniverseChainInfo
