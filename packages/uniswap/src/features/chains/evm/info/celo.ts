import { GraphQLApi } from '@universe/api'
import { SwapConfigKey } from '@universe/gating'
import { CELO_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { getQuicknodeEndpointUrl } from 'uniswap/src/features/chains/evm/rpc'
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
import { celo } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0xceba9300f2b948710d2653dd7b07f33a8b32118c', UniverseChainId.Celo),
  },
})

export const CELO_CHAIN_INFO = {
  ...celo,
  id: UniverseChainId.Celo,
  platform: Platform.EVM,
  assetRepoNetworkName: 'celo',
  backendChain: {
    chain: GraphQLApi.Chain.Celo as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  },
  blockPerMainnetEpochForChainId: 2,
  blockWaitMsBeforeWarning: 600000,
  bridge: 'https://www.portalbridge.com/#/transfer',
  docs: 'https://docs.celo.org/',
  elementName: ElementName.ChainCelo,
  explorer: {
    name: 'Celoscan',
    url: 'https://celoscan.io/',
    apiURL: 'https://api.celoscan.io',
  },
  interfaceName: 'celo',
  label: 'Celo',
  logo: CELO_LOGO,
  name: 'Celo Mainnet',
  nativeCurrency: {
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18,
    address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    logo: CELO_LOGO,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  tokens,
  statusPage: undefined,
  supportsV4: true,
  urlParam: 'celo',
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Celo)] },
    [RPCType.Default]: { http: [`https://forno.celo.org`] },
    [RPCType.Interface]: { http: [`https://celo-mainnet.infura.io/v3/${config.infuraKey}`] },
  },
  wrappedNativeCurrency: {
    name: 'Celo',
    symbol: 'CELO',
    decimals: 18,
    address: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  },
  gasConfig: {
    send: {
      configKey: SwapConfigKey.CeloSendMinGasAmount,
      default: 13, // .0013 CELO
    },
    swap: {
      configKey: SwapConfigKey.CeloSwapMinGasAmount,
      default: 2000, // .2 CELO
    },
  },
  tradingApiPollingIntervalMs: 200,
} as const satisfies UniverseChainInfo
