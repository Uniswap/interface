import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'

import ConfiguredJsonRpcProvider from 'rpc/ConfiguredJsonRpcProvider'
import { CHAIN_IDS_TO_NAMES, CHAIN_INFO, SUPPORTED_INTERFACE_CHAIN_IDS, SupportedInterfaceChainId } from './chains'

function getAppProvider(chainId: SupportedInterfaceChainId) {
  const info = CHAIN_INFO[chainId]
  return new AppJsonRpcProvider(
    info.rpcUrls.appOnly.map(
      (url) => new ConfiguredJsonRpcProvider(url, { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })
    )
  )
}

/** These are the only JsonRpcProviders used directly by the interface. */
export const RPC_PROVIDERS = Object.fromEntries(
  SUPPORTED_INTERFACE_CHAIN_IDS.map((chain) => [chain as SupportedInterfaceChainId, getAppProvider(chain)])
) as Record<SupportedInterfaceChainId, AppJsonRpcProvider>
