import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'
import ConfiguredJsonRpcProvider from 'rpc/ConfiguredJsonRpcProvider'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { SUPPORTED_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'

function getAppProvider(chainId: UniverseChainId) {
  const info = getChainInfo(chainId)
  return new AppJsonRpcProvider(
    info.rpcUrls.interface.http.map((url) => new ConfiguredJsonRpcProvider(url, { chainId, name: info.interfaceName })),
  )
}

/** These are the only JsonRpcProviders used directly by the interface. */
export const RPC_PROVIDERS = Object.fromEntries(
  SUPPORTED_CHAIN_IDS.map((chain) => [chain as UniverseChainId, getAppProvider(chain)]),
) as Record<UniverseChainId, AppJsonRpcProvider>
