import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'

import ConfiguredJsonRpcProvider from 'rpc/ConfiguredJsonRpcProvider'
import { APP_RPC_URLS, CHAIN_IDS_TO_NAMES, SUPPORTED_INTERFACE_CHAIN_IDS, SupportedInterfaceChainId } from './chains'

function getAppProvider(chainId: SupportedInterfaceChainId) {
  return new AppJsonRpcProvider(
    APP_RPC_URLS[chainId].map(
      (url) => new ConfiguredJsonRpcProvider(url, { chainId, name: CHAIN_IDS_TO_NAMES[chainId] })
    )
  )
}

/** These are the only JsonRpcProviders used directly by the interface. */
export const RPC_PROVIDERS = Object.fromEntries(
  SUPPORTED_INTERFACE_CHAIN_IDS.map((chain) => [chain as SupportedInterfaceChainId, getAppProvider(chain)])
) as Record<SupportedInterfaceChainId, AppJsonRpcProvider>
