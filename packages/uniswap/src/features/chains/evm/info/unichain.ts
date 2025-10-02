import { GraphQLApi } from '@universe/api'
import { ETH_LOGO, ETHEREUM_LOGO, UNICHAIN_LOGO, UNICHAIN_SEPOLIA_LOGO } from 'ui/src/assets'
import { DEFAULT_NATIVE_ADDRESS_LEGACY, getQuicknodeEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
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
import { unichainSepolia } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x078D782b760474a361dDA0AF3839290b0EF57AD6', UniverseChainId.Unichain),
  },
})

export const UNICHAIN_CHAIN_INFO = {
  // ...unichain, // TODO update once available from viem
  name: 'Unichain',
  id: UniverseChainId.Unichain,
  platform: Platform.EVM,
  assetRepoNetworkName: 'unichain',
  backendChain: {
    chain: GraphQLApi.Chain.Unichain as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 6,
  blockWaitMsBeforeWarning: undefined,
  bridge: 'https://www.unichain.org/bridge',
  docs: 'https://docs.unichain.org',
  elementName: ElementName.ChainUnichain,
  explorer: {
    name: 'Unichain Explorer',
    url: 'https://uniscan.xyz/',
  },
  openseaName: 'unichain',
  interfaceName: 'unichain',
  label: 'Unichain',
  logo: UNICHAIN_LOGO,
  nativeCurrency: {
    name: 'Unichain ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETHEREUM_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Unichain)] },
    [RPCType.Default]: { http: ['https://mainnet.unichain.org'] },
    [RPCType.Interface]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Unichain)] },
  },
  tokens,
  statusPage: undefined,
  subblockTimeMs: 200,
  supportsV4: true,
  urlParam: 'unichain',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  testnet: false,
  tradingApiPollingIntervalMs: 150,
} as const satisfies UniverseChainInfo

const testnetTokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x31d0220469e10c4E71834a79b1f276d740d3768F', UniverseChainId.UnichainSepolia),
  },
})

export const UNICHAIN_SEPOLIA_CHAIN_INFO = {
  ...unichainSepolia,
  name: 'Unichain Sepolia',
  testnet: true,
  id: UniverseChainId.UnichainSepolia,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: GraphQLApi.Chain.AstrochainSepolia as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  bridge: undefined,
  docs: 'https://docs.unichain.org/',
  elementName: ElementName.ChainUnichainSepolia,
  explorer: {
    name: 'Unichain Sepolia Explorer',
    url: 'https://unichain-sepolia.blockscout.com/',
  },
  interfaceName: 'astrochain',
  label: 'Unichain Sepolia',
  logo: UNICHAIN_SEPOLIA_LOGO,
  nativeCurrency: {
    name: 'Unichain Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.UnichainSepolia)],
    },
    [RPCType.Default]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.UnichainSepolia)],
    },
    [RPCType.Interface]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.UnichainSepolia)],
    },
  },
  tokens: testnetTokens,
  statusPage: undefined,
  subblockTimeMs: 200,
  supportsV4: true,
  urlParam: 'unichain_sepolia',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  tradingApiPollingIntervalMs: 150,
} as const satisfies UniverseChainInfo
