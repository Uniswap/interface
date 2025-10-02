import { GraphQLApi } from '@universe/api'
import { SOLANA_LOGO } from 'ui/src/assets'
import { buildChainTokens } from 'uniswap/src/features/chains/evm/tokens'
import { DEFAULT_NATIVE_ADDRESS_SOLANA, WRAPPED_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { NetworkLayer, RPCType, UniverseChainId, UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { SolanaToken } from 'uniswap/src/features/tokens/SolanaToken'

// TODO(WEB-8095): Remove this once we have a proper RPC URL
const TEMP_RPC_URL =
  'https://wandering-stylish-forest.solana-mainnet.quiknode.pro/d6166fc738c9c06adee384fff922a7929ccb7222'

const tokens = buildChainTokens({
  stables: {
    USDC: new SolanaToken(
      UniverseChainId.Solana,
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      6,
      'USDC',
      'USD Coin',
    ),
  },
})

export const SOLANA_CHAIN_INFO = {
  id: UniverseChainId.Solana,
  platform: Platform.SVM,
  assetRepoNetworkName: 'solana',
  blockPerMainnetEpochForChainId: 1,
  urlParam: 'solana',
  name: 'Solana',
  tokens,
  blockWaitMsBeforeWarning: undefined,
  bridge: undefined,
  docs: 'https://docs.solana.com',
  elementName: ElementName.ChainSolana,
  supportsV4: false,
  explorer: {
    name: 'Solana Explorer',
    url: 'https://solscan.io/',
    apiURL: 'https://api.explorer.solana.com',
  },
  interfaceName: 'solana',
  label: 'Solana',
  logo: SOLANA_LOGO,
  nativeCurrency: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    address: DEFAULT_NATIVE_ADDRESS_SOLANA,
    explorerLink: 'https://explorer.solana.com',
    logo: SOLANA_LOGO,
  },
  wrappedNativeCurrency: {
    name: 'Wrapped SOL',
    symbol: 'wSOL',
    decimals: 9,
    address: WRAPPED_SOL_ADDRESS_SOLANA,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Default]: {
      http: [TEMP_RPC_URL],
    },
    [RPCType.Interface]: {
      http: [TEMP_RPC_URL],
    },
  },
  backendChain: {
    chain: GraphQLApi.Chain.Solana,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  testnet: false,
  statusPage: 'https://status.solana.com/',
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
