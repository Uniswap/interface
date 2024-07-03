import { CHAIN_IDS_TO_NAMES, SupportedInterfaceChainId } from 'constants/chains'
import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'
import ConfiguredJsonRpcProvider from 'rpc/ConfiguredJsonRpcProvider'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { WEB_SUPPORTED_CHAIN_IDS } from 'uniswap/src/types/chains'

function getAppProvider(chainId: SupportedInterfaceChainId) {
  const info = UNIVERSE_CHAIN_INFO[chainId]
  return new AppJsonRpcProvider(
    info.rpcUrls.appOnly.http.map(
      (url) => new ConfiguredJsonRpcProvider(url, { chainId, name: CHAIN_IDS_TO_NAMES[chainId] }),
    ),
  )
}

/** These are the only JsonRpcProviders used directly by the interface. */
export const RPC_PROVIDERS = Object.fromEntries(
  WEB_SUPPORTED_CHAIN_IDS.map((chain) => [chain as SupportedInterfaceChainId, getAppProvider(chain)]),
) as Record<SupportedInterfaceChainId, AppJsonRpcProvider>
