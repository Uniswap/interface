import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'
import ConfiguredJsonRpcProvider from 'rpc/ConfiguredJsonRpcProvider'
import { ALL_EVM_CHAIN_IDS, getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'

function getAppProvider(chainId: UniverseChainId) {
  const info = getChainInfo(chainId)
  return new AppJsonRpcProvider(
    info.rpcUrls.interface.http.map(
      (url) => new ConfiguredJsonRpcProvider({ url, networkish: { chainId, name: info.interfaceName } }),
    ),
  )
}

/** These are the only JsonRpcProviders used directly by the interface. */
export const RPC_PROVIDERS = Object.fromEntries(
  ALL_EVM_CHAIN_IDS.map((chain) => [chain, getAppProvider(chain)]),
) as Record<EVMUniverseChainId, AppJsonRpcProvider>
