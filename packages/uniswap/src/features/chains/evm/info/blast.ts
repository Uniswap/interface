import { CurrencyAmount } from '@uniswap/sdk-core'
import { BLAST_LOGO, ETH_LOGO } from 'ui/src/assets'
import { config } from 'uniswap/src/config'
import { USDB_BLAST } from 'uniswap/src/constants/tokens'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  DEFAULT_NATIVE_ADDRESS_LEGACY,
  DEFAULT_RETRY_OPTIONS,
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
import { blast } from 'wagmi/chains'

export const BLAST_CHAIN_INFO = {
  ...blast,
  id: UniverseChainId.Blast,
  assetRepoNetworkName: 'blast',
  backendChain: {
    chain: BackendChainId.Blast as GqlChainId,
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
  interfaceName: 'blast',
  label: 'Blast',
  logo: BLAST_LOGO,
  networkLayer: NetworkLayer.L2,
  pendingTransactionsRetryOptions: DEFAULT_RETRY_OPTIONS,
  spotPriceStablecoinAmount: CurrencyAmount.fromRawAmount(USDB_BLAST, 10_000e18),
  stablecoins: [USDB_BLAST],
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
} as const satisfies UniverseChainInfo
