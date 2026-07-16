import { Token } from '@uniswap/sdk-core'
import { GraphQLApi, TradingApi } from '@universe/api'
import { ETH_LOGO, ROBINHOOD_LOGO } from 'ui/src/assets'
import { ALL_APPS_CHAIN_SUPPORTED_APPS } from 'uniswap/src/features/chains/chainAppSupport'
import { CHAIN_ID_TO_URL_PARAM } from 'uniswap/src/features/chains/chainUrlParam'
import { DEFAULT_MS_BEFORE_WARNING, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
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

const tokens = buildChainTokens({
  stables: {
    USDG: new Token(
      UniverseChainId.Robinhood,
      '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
      6,
      'USDG',
      'Global Dollar',
    ),
  },
  primaryStablecoin: 'USDG',
})

export const ROBINHOOD_CHAIN_INFO = {
  id: UniverseChainId.Robinhood,
  platform: Platform.EVM,
  supportedApps: ALL_APPS_CHAIN_SUPPORTED_APPS,
  testnet: false,
  assetRepoNetworkName: 'robinhood',
  backendChain: {
    chain: GraphQLApi.Chain.Robinhood as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: DEFAULT_MS_BEFORE_WARNING,
  bridge: 'https://portal.arbitrum.io/bridge?destinationChain=robinhood-chain',
  docs: 'https://docs.robinhood.com/chain/',
  elementName: ElementName.ChainRobinhood,
  explorer: {
    name: 'Robinscan',
    url: 'https://robinscan.io/',
  },
  interfaceName: 'robinhood',
  label: 'Robinhood Chain',
  logo: ROBINHOOD_LOGO,
  name: 'Robinhood Chain',
  nativeCurrency: {
    name: 'Robinhood ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  blockTimeMs: 100,
  pendingTransactionsRetryOptions: undefined,
  // HookSwap has no Uniswap-hosted UniRPC gateway access, so `getUniRpcEndpointUrl()`
  // (Uniswap's `entry-gateway`) 401s/CORS-fails for every browser-side on-chain read
  // (wagmi's public client uses RPCType.Public — see apps/web/src/connection/wagmiConfig.ts)
  // — this silently broke Locker/Referrals ("Failed to load") despite the contracts
  // and RPC working fine directly (verified via `cast call`). Fix: real public RPC on
  // every RPCType slot, mirroring the already-correct ink.ts/hyperevm.ts pattern.
  // Primary = QuickNode dedicated endpoint for chainId 4663 (verified: eth_chainId
  // returns 0x1237, and it reflects the request Origin in Access-Control-Allow-Origin
  // — browser-safe from hookswap.org; the auth token is public in the client bundle,
  // so restrict the QuickNode endpoint to the hookswap.org domain). Then the two public
  // RPCs as fallback (both return 4663 with permissive CORS). Ordered so wagmi's
  // `orderedTransportUrls(chain)` → viem `fallback(...)` fails over to the official RPC,
  // then the Blockscout eth-rpc proxy, if QuickNode is down. (The ethers balance path
  // via rpcUrlSelector uses http[0] — QuickNode — as its single endpoint.)
  rpcUrls: {
    [RPCType.Default]: {
      http: [
        'https://late-fittest-putty.robinhood-mainnet.quiknode.pro/1b8b235edc8b92a9bcad773b0fcbbda6d537a583',
        'https://rpc.mainnet.chain.robinhood.com/',
        'https://robinhoodchain.blockscout.com/api/eth-rpc',
      ],
    },
    [RPCType.Public]: {
      http: [
        'https://late-fittest-putty.robinhood-mainnet.quiknode.pro/1b8b235edc8b92a9bcad773b0fcbbda6d537a583',
        'https://rpc.mainnet.chain.robinhood.com/',
        'https://robinhoodchain.blockscout.com/api/eth-rpc',
      ],
    },
    [RPCType.Interface]: {
      http: [
        'https://late-fittest-putty.robinhood-mainnet.quiknode.pro/1b8b235edc8b92a9bcad773b0fcbbda6d537a583',
        'https://rpc.mainnet.chain.robinhood.com/',
        'https://robinhoodchain.blockscout.com/api/eth-rpc',
      ],
    },
  },
  supportedURVersions: [TradingApi.UniversalRouterVersion._2_0, TradingApi.UniversalRouterVersion._2_1_1],
  supportsV4: false,
  supportsNFTs: true,
  tokens,
  urlParam: CHAIN_ID_TO_URL_PARAM[UniverseChainId.Robinhood],
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
  },
  gasConfig: GENERIC_L2_GAS_CONFIG,
  tradingApiPollingIntervalMs: 250,
} as const satisfies UniverseChainInfo
