import { CurrencyAmount } from '@uniswap/sdk-core'
import { ETHEREUM_LOGO, ETH_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { DAI, USDC, USDC_SEPOLIA, USDT } from 'uniswap/src/constants/tokens'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  getPlaywrightRpcUrls,
  getQuicknodeEndpointUrl,
} from 'uniswap/src/features/chains/evm/rpc'
import {
  GqlChainId,
  NetworkLayer,
  RPCType,
  UniverseChainId,
  UniverseChainInfo,
} from 'uniswap/src/features/chains/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isInterface } from 'utilities/src/platform'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { mainnet, sepolia } from 'wagmi/chains'

const LOCAL_MAINNET_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8545'

export const MAINNET_CHAIN_INFO = {
  ...mainnet,
  id: UniverseChainId.Mainnet,
  assetRepoNetworkName: 'ethereum',
  backendChain: {
    chain: BackendChainId.Ethereum as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: isInterface ? DEFAULT_MS_BEFORE_WARNING : ONE_MINUTE_MS,
  bridge: undefined,
  docs: 'https://docs.uniswap.org/',
  elementName: ElementName.ChainEthereum,
  explorer: {
    name: 'Etherscan',
    url: 'https://etherscan.io/',
    apiURL: 'https://api.etherscan.io',
  },
  interfaceName: 'mainnet',
  label: 'Ethereum',
  logo: ETHEREUM_LOGO,
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    explorerLink: 'https://etherscan.io/chart/etherprice',
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: isPlaywrightEnv()
    ? getPlaywrightRpcUrls(LOCAL_MAINNET_PLAYWRIGHT_RPC_URL)
    : {
        [RPCType.Private]: {
          http: ['https://rpc.mevblocker.io/?referrer=uniswapwallet'],
        },
        [RPCType.Public]: {
          http: [getQuicknodeEndpointUrl(UniverseChainId.Mainnet)],
        },
        [RPCType.Default]: {
          http: [getQuicknodeEndpointUrl(UniverseChainId.Mainnet)],
        },
        [RPCType.Fallback]: {
          http: ['https://rpc.ankr.com/eth', 'https://eth-mainnet.public.blastapi.io'],
        },
        [RPCType.Interface]: {
          http: [`https://mainnet.infura.io/v3/${config.infuraKey}`, getQuicknodeEndpointUrl(UniverseChainId.Mainnet)],
        },
      },
  urlParam: 'ethereum',
  statusPage: undefined,
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC, 100_000e6),
  stablecoins: [USDC, DAI, USDT],
  supportsV4: true,
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
} as const satisfies UniverseChainInfo

export const SEPOLIA_CHAIN_INFO = {
  ...sepolia,
  id: UniverseChainId.Sepolia,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: BackendChainId.EthereumSepolia as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  bridge: undefined,
  docs: 'https://docs.uniswap.org/',
  elementName: ElementName.ChainSepolia,
  explorer: {
    name: 'Etherscan',
    url: 'https://sepolia.etherscan.io/',
    apiURL: 'https://api-sepolia.etherscan.io',
  },
  interfaceName: 'sepolia',
  label: 'Sepolia',
  logo: ETHEREUM_LOGO,
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    explorerLink: 'https://sepolia.etherscan.io/chart/etherprice',
    logo: ETH_LOGO,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: {
      http: [getQuicknodeEndpointUrl(UniverseChainId.Sepolia)],
    },
    [RPCType.Default]: {
      http: ['https://rpc.sepolia.org/'],
    },
    [RPCType.Fallback]: {
      http: [
        'https://rpc.sepolia.org/',
        'https://rpc2.sepolia.org/',
        'https://rpc.sepolia.online/',
        'https://www.sepoliarpc.space/',
        'https://rpc-sepolia.rockx.com/',
        'https://rpc.bordel.wtf/sepolia',
      ],
    },
    [RPCType.Interface]: { http: [`https://sepolia.infura.io/v3/${config.infuraKey}`] },
  },
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDC_SEPOLIA, 100e6),
  stablecoins: [USDC_SEPOLIA],
  statusPage: undefined,
  supportsV4: true,
  urlParam: 'ethereum_sepolia',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
  },
} as const satisfies UniverseChainInfo
