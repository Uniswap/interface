import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { BLAST_LOGO, ETH_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import {
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
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
import { blast } from 'wagmi/chains'

const tokens = buildChainTokens({
  stables: {
    USDB: new Token(UniverseChainId.Blast, '0x4300000000000000000000000000000000000003', 18, 'USDB', 'USDB'),
  },
})

export const BLAST_CHAIN_INFO = {
  ...blast,
  id: UniverseChainId.Blast,
  platform: Platform.EVM,
  assetRepoNetworkName: 'blast',
  backendChain: {
    chain: GraphQLApi.Chain.Blast as GqlChainId,
    backendSupported: true,
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: undefined,
  bridge: 'https://blast.io/bridge',
  docs: 'https://docs.blast.io',
  elementName: ElementName.ChainBlast,
  explorer: {
    name: 'BlastScan',
    url: 'https://blastscan.io/',
    apiURL: 'https://api.blastscan.io',
  },
  openseaName: 'blast',
  interfaceName: 'blast',
  label: 'Blast',
  logo: BLAST_LOGO,
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  tokens,
  statusPage: undefined,
  supportsV4: true,
  urlParam: 'blast',
  nativeCurrency: {
    name: 'Blast ETH',
    symbol: 'ETH',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: ETH_LOGO,
  },
  rpcUrls: {
    [RPCType.Public]: { http: [getQuicknodeEndpointUrl(UniverseChainId.Blast)] },
    [RPCType.Default]: { http: ['https://rpc.blast.io/'] },
    [RPCType.Interface]: { http: [`https://blast-mainnet.infura.io/v3/${config.infuraKey}`] },
  },
  wrappedNativeCurrency: {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    address: '0x4300000000000000000000000000000000000004',
  },
  tradingApiPollingIntervalMs: 200,
} as const satisfies UniverseChainInfo
