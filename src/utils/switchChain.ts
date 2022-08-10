import { Connector } from '@web3-react/types'
import { networkConnection, walletConnectConnection } from 'connection'
import { getChainInfo } from 'constants/chainInfo'
import { ALL_SUPPORTED_CHAIN_IDS, SupportedChainId } from 'constants/chains'
import { RPC_URLS } from 'constants/networks'

function getRpcUrls(chainId: SupportedChainId): [string] {
  switch (chainId) {
    case SupportedChainId.MAINNET:
    case SupportedChainId.RINKEBY:
    case SupportedChainId.ROPSTEN:
    case SupportedChainId.KOVAN:
    case SupportedChainId.GOERLI:
      return [RPC_URLS[chainId]]
    case SupportedChainId.OPTIMISM:
      return ['https://mainnet.optimism.io']
    case SupportedChainId.OPTIMISTIC_KOVAN:
      return ['https://kovan.optimism.io']
    case SupportedChainId.ARBITRUM_ONE:
      return ['https://arb1.arbitrum.io/rpc']
    case SupportedChainId.ARBITRUM_RINKEBY:
      return ['https://rinkeby.arbitrum.io/rpc']
    case SupportedChainId.POLYGON:
      return ['https://polygon-rpc.com/']
    case SupportedChainId.POLYGON_MUMBAI:
      return ['https://rpc-endpoints.superfluid.dev/mumbai']
    case SupportedChainId.CELO:
      return ['https://forno.celo.org']
    case SupportedChainId.CELO_ALFAJORES:
      return ['https://alfajores-forno.celo-testnet.org']
    default:
  }
  // Our API-keyed URLs will fail security checks when used with external wallets.
  throw new Error('RPC URLs must use public endpoints')
}

export function isChainAllowed(chainId: number) {
  return ALL_SUPPORTED_CHAIN_IDS.includes(chainId)
}

export const switchChain = async (connector: Connector, chainId: SupportedChainId) => {
  if (!isChainAllowed(chainId)) {
    throw new Error(`Chain ${chainId} not supported for connector (${typeof connector})`)
  } else if (connector === walletConnectConnection.connector || connector === networkConnection.connector) {
    await connector.activate(chainId)
  } else {
    const info = getChainInfo(chainId)
    const addChainParameter = {
      chainId,
      chainName: info.label,
      rpcUrls: getRpcUrls(chainId),
      nativeCurrency: info.nativeCurrency,
      blockExplorerUrls: [info.explorer],
    }
    await connector.activate(addChainParameter)
  }
}
