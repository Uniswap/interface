import AppJsonRpcProvider from 'rpc/AppJsonRpcProvider'
import ConfiguredJsonRpcProvider from 'rpc/ConfiguredJsonRpcProvider'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { SUPPORTED_CHAIN_IDS, SUPPORTED_TESTNET_CHAIN_IDS, UniverseChainId } from 'uniswap/src/features/chains/types'

function getAppProvider(chainId: UniverseChainId) {
  console.log(chainId, 'pippo')
  const info = getChainInfo(chainId)
  return new AppJsonRpcProvider(
    info.rpcUrls.interface.http.map(
      (url /*, index*/) => {
        //const overrideUrl = index === 0 && chainId === UniverseChainId.Bnb
        //  ? process.env.REACT_APP_BNB_RPC_URL
        //  : index === 0 && chainId === UniverseChainId.Base
        //  ? process.env.REACT_APP_BASE_MAINNET_RPC_URL
        //  : url
        return new ConfiguredJsonRpcProvider(url, { chainId, name: info.interfaceName }
      )},
    ),
  )
}

/** These are the only JsonRpcProviders used directly by the interface. */
export const RPC_PROVIDERS = Object.fromEntries(
  SUPPORTED_CHAIN_IDS.map((chain) => [chain as UniverseChainId, getAppProvider(chain)]),
) as Record<UniverseChainId, AppJsonRpcProvider>

export const TESTNET_RPC_PROVIDERS = Object.fromEntries(
  SUPPORTED_TESTNET_CHAIN_IDS.map((chain) => [chain as UniverseChainId, getAppProvider(chain)]),
) as Record<UniverseChainId, AppJsonRpcProvider>

export function getBackupRpcProvider(chainId: UniverseChainId) {
  const info = getChainInfo(chainId)
  const url = 'https://api.rigoblock.com/logs'
  return new AppJsonRpcProvider([new ConfiguredJsonRpcProvider(url, { chainId, name: info.interfaceName })]);
}
