import { CurrencyAmount } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { SwapConfigKey } from '@universe/gating'
import { ETH_LOGO, ETHEREUM_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import {
  DEFAULT_MS_BEFORE_WARNING,
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  getPlaywrightRpcUrls,
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
import { buildDAI, buildUSDC, buildUSDT } from 'uniswap/src/features/tokens/stablecoin'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { isWebApp } from 'utilities/src/platform'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { mainnet, sepolia } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', UniverseChainId.Mainnet),
    USDT: buildUSDT('0xdAC17F958D2ee523a2206206994597C13D831ec7', UniverseChainId.Mainnet),
    DAI: buildDAI('0x6B175474E89094C44Da98b954EedeAC495271d0F', UniverseChainId.Mainnet),
  },
})

const LOCAL_MAINNET_PLAYWRIGHT_RPC_URL = 'http://127.0.0.1:8545'

export const MAINNET_CHAIN_INFO = {
  ...mainnet,
  id: UniverseChainId.Mainnet,
  platform: Platform.EVM,
  assetRepoNetworkName: 'ethereum',
  backendChain: {
    chain: GraphQLApi.Chain.Ethereum as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: isWebApp ? DEFAULT_MS_BEFORE_WARNING : ONE_MINUTE_MS,
  bridge: undefined,
  docs: 'https://docs.uniswap.org/',
  elementName: ElementName.ChainEthereum,
  explorer: {
    name: 'Etherscan',
    url: 'https://etherscan.io/',
    apiURL: 'https://api.etherscan.io',
  },
  openseaName: 'ethereum',
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
  spotPriceStablecoinAmountOverride: CurrencyAmount.fromRawAmount(tokens.USDC, 100_000e6),
  tokens,
  supportsV4: true,
  supportsNFTs: true,
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  gasConfig: {
    send: {
      configKey: SwapConfigKey.EthSendMinGasAmount,
      default: 20, // .002 ETH
    },
    swap: {
      configKey: SwapConfigKey.EthSwapMinGasAmount,
      default: 150, // .015 ETH
    },
  },
  tradingApiPollingIntervalMs: 500,
  acrossProtocolAddress: '0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5',
} as const satisfies UniverseChainInfo

const testnetTokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x1c7d4b196cb0c7b01d743fbc6116a902379c7238', UniverseChainId.Sepolia),
  },
})

export const SEPOLIA_CHAIN_INFO = {
  ...sepolia,
  id: UniverseChainId.Sepolia,
  platform: Platform.EVM,
  assetRepoNetworkName: undefined,
  backendChain: {
    chain: GraphQLApi.Chain.EthereumSepolia as GqlChainId,
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
  spotPriceStablecoinAmountOverride: CurrencyAmount.fromRawAmount(testnetTokens.USDC, 100e6),
  tokens: testnetTokens,
  statusPage: undefined,
  supportsV4: true,
  supportsNFTs: false,
  urlParam: 'ethereum_sepolia',
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
  },
  gasConfig: {
    send: {
      configKey: SwapConfigKey.EthSendMinGasAmount,
      default: 20, // .002 ETH
    },
    swap: {
      configKey: SwapConfigKey.EthSwapMinGasAmount,
      default: 150, // .015 ETH
    },
  },
  tradingApiPollingIntervalMs: 500,
} as const satisfies UniverseChainInfo
