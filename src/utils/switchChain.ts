import { ChainId } from '@pollum-io/smart-order-router'
import { Connector } from '@web3-react/types'
import { networkConnection, walletConnectV2Connection } from 'connection'
import { getChainInfo } from 'constants/chainInfo'
import { isSupportedChain } from 'constants/chains'
import { FALLBACK_URLS } from 'constants/networks'

function getRpcUrl(chainId: ChainId): string {
  switch (chainId) {
    // case SupportedChainId.MAINNET:
    // case SupportedChainId.GOERLI:
    // return RPC_URLS[chainId][0]
    // Attempting to add a chain using an infura URL will not work, as the URL will be unreachable from the MetaMask background page.
    // MetaMask allows switching to any publicly reachable URL, but for novel chains, it will display a warning if it is not on the "Safe" list.
    // See the definition of FALLBACK_URLS for more details.
    default:
      return FALLBACK_URLS[chainId][0]
  }
}

export const switchChain = async (connector: Connector, chainId: ChainId) => {
  if (!isSupportedChain(chainId)) {
    throw new Error(`Chain ${chainId} not supported for connector (${typeof connector})`)
  } else if (connector === walletConnectV2Connection.connector || connector === networkConnection.connector) {
    await connector.activate(chainId)
  } else {
    const info = getChainInfo(chainId)
    const addChainParameter = {
      chainId,
      chainName: info.label,
      rpcUrls: [getRpcUrl(chainId)],
      nativeCurrency: info.nativeCurrency,
      blockExplorerUrls: [info.explorer],
    }
    await connector.activate(addChainParameter)
  }
}
