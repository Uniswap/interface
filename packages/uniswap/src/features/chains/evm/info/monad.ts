import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { SwapConfigKey } from '@universe/gating'
import { MONAD_LOGO_FILLED } from 'ui/src/assets'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
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
import { buildUSDC } from 'uniswap/src/features/tokens/stablecoin'

const mainnetTokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x754704Bc059F8C67012fEd69BC8A327a5aafb603', UniverseChainId.Monad),
    AUSD: new Token(UniverseChainId.Monad, '0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a', 6, 'AUSD', 'Agora USD'),
  },
})

export const MONAD_CHAIN_INFO = {
  id: UniverseChainId.Monad,
  platform: Platform.EVM,
  testnet: false,
  assetRepoNetworkName: 'monad',
  backendChain: {
    chain: GraphQLApi.Chain.Monad as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  bridge: 'https://monadbridge.com/',
  docs: 'https://docs.monad.xyz/',
  label: 'Monad',
  logo: MONAD_LOGO_FILLED,
  name: 'Monad',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: MONAD_LOGO_FILLED,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  statusPage: undefined, // TODO: Add status page URL when available
  supportsV4: true,
  supportsNFTs: false,
  urlParam: 'monad',
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Monad)] },
    [RPCType.Default]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Monad)] },
    [RPCType.Interface]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Monad)] },
  },
  wrappedNativeCurrency: {
    name: 'Wrapped Monad',
    symbol: 'WMON',
    decimals: 18,
    address: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  elementName: ElementName.ChainMonad,
  explorer: {
    name: 'Monad Explorer',
    url: 'https://monadvision.com/',
  },
  interfaceName: 'monad',
  tokens: mainnetTokens,
  tradingApiPollingIntervalMs: 150, // approximately 1/3 of block time, which is around 400-500 ms
  gasConfig: {
    send: {
      configKey: SwapConfigKey.MonSendMinGasAmount,
      default: 20, // .002 ETH equivalent
    },
    swap: {
      configKey: SwapConfigKey.MonSwapMinGasAmount,
      default: 150, // .015 ETH equivalent
    },
  },
  acrossProtocolAddress: '0xd2ecb3afe598b746F8123CaE365a598DA831A449',
} as const satisfies UniverseChainInfo
