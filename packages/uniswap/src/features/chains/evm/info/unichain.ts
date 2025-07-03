// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { CurrencyAmount, ChainId as UniswapSDKChainId } from '@uniswap/sdk-core'
import { ETHEREUM_LOGO, ETH_LOGO, UNICHAIN_LOGO, UNICHAIN_SEPOLIA_LOGO } from 'ui/src/assets'
import { USDC_UNICHAIN, USDC_UNICHAIN_SEPOLIA } from 'uniswap/src/constants/tokens'
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
import { unichainSepolia } from 'wagmi/chains'

export const UNICHAIN_CHAIN_INFO = {
  // ...unichain, // TODO update once available from viem
  name: 'Unichain',
  id: UniverseChainId.Unichain,
  sdkId: UniswapSDKChainId.UNICHAIN,
  assetRepoNetworkName: 'unichain',
  backendChain: {
    chain: BackendChainId.Unichain as GqlChainId,
    backendSupported: true,
    isSecondaryChain: false,
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
  helpCenterUrl: undefined,
  infoLink: 'https://app.uniswap.org/explore/tokens/unichain',
  infuraPrefix: 'unichain',
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
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_UNICHAIN, 10_000e6),
  stablecoins: [USDC_UNICHAIN],
  statusPage: undefined,
  supportsInterfaceClientSideRouting: true,
  supportsGasEstimates: true,
  supportsV4: true,
  urlParam: 'unichain',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
  testnet: false,
} as const satisfies UniverseChainInfo

export const UNICHAIN_SEPOLIA_CHAIN_INFO = {
  ...unichainSepolia,
  name: 'Unichain Sepolia',
  testnet: true,
  id: UniverseChainId.UnichainSepolia,
  sdkId: UniswapSDKChainId.UNICHAIN_SEPOLIA,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: BackendChainId.AstrochainSepolia as GqlChainId,
    backendSupported: true,
    isSecondaryChain: false,
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
  helpCenterUrl: undefined,
  infoLink: 'https://app.uniswap.org/explore', // need
  infuraPrefix: 'astrochain-sepolia',
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
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_UNICHAIN_SEPOLIA, 10_000e6),
  stablecoins: [USDC_UNICHAIN_SEPOLIA],
  statusPage: undefined,
  supportsInterfaceClientSideRouting: true,
  supportsGasEstimates: false,
  supportsV4: true,
  urlParam: 'unichain_sepolia',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4200000000000000000000000000000000000006',
  },
} as const satisfies UniverseChainInfo
