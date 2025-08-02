import { Token } from '@uniswap/sdk-core'
import { config } from 'uniswap/src/config'
import { Chain as BackendChainId } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
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
import { buildUSDC, buildUSDT } from 'uniswap/src/features/tokens/stablecoin'
// (no existing wagmi import needed since we’re on Qubetics RPC)

const QUBETICS_CHAIN_ID = UniverseChainId.Qubetics  // you’ll add this enum value too

// If you have on-chain USDC/USDT on Qubetics, plug those addresses here;
// otherwise leave stables empty or omit them.
const tokens = buildChainTokens({
  stables: {
    USDC: buildUSDC('0x0000000000000000000000000000000000000000', QUBETICS_CHAIN_ID),
    USDT: buildUSDT('0x0000000000000000000000000000000000000000', QUBETICS_CHAIN_ID),
  },
})

export const QUBETICS_CHAIN_INFO = {
  id: QUBETICS_CHAIN_ID,
  platform: Platform.EVM,
  assetRepoNetworkName: 'qubetics',
  backendChain: {
    chain: BackendChainId.Ethereum as GqlChainId, // or a custom enum if you extend
    backendSupported: false,                     // no GraphQL subgraph yet
    nativeTokenBackendAddress: undefined,
  },
  blockPerMainnetEpochForChainId: 1,
  blockWaitMsBeforeWarning: 600000,
  bridge: 'https://swft.com/bridge/TICS',     // SWFT Bridge for TICS
  docs: 'https://docs.qubetics.com/',
  elementName: ElementName.ChainEthereum,       // reuse Ethereum icon styling
  explorer: {
    name: 'TicsScan',
    url: 'https://ticsscan.com',
    apiURL: 'https://api.ticsscan.com',
  },
  interfaceName: 'qubetics',
  label: 'Qubetics',
  logo: undefined,                              // point to a local /images/qubetics.svg
  name: 'Qubetics Mainnet',
  nativeCurrency: {
    name: 'TICS',
    symbol: 'TICS',
    decimals: 18,
    address: DEFAULT_NATIVE_ADDRESS_LEGACY,
    logo: undefined,
  },
  networkLayer: NetworkLayer.L1,
  pendingTransactionsRetryOptions: undefined,
  rpcUrls: {
    [RPCType.Public]: { http: ['https://rpc.qubetics.com'] },
    [RPCType.Default]: { http: [getQuicknodeEndpointUrl(QUBETICS_CHAIN_ID)] },
    [RPCType.Interface]: { http: [`https://qubetics.infura.io/v3/${config.infuraKey}`] },
  },
  tokens,
  statusPage: undefined,
  supportsV4: false,
  urlParam: 'qubetics',
  wrappedNativeCurrency: {
    name: 'Wrapped TICS',
    symbol: 'WTICS',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // deploy your wTICS wrapper here
  },
  tradingApiPollingIntervalMs: 200,
} as const satisfies UniverseChainInfo
