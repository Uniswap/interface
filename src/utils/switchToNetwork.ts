import { AddEthereumChainParameter, Connector } from '@web3-react/types'
import { CHAIN_INFO } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { INFURA_NETWORK_URLS } from 'constants/infura'

function getRpcUrls(chainId: SupportedChainId): [string] {
  switch (chainId) {
    case SupportedChainId.MAINNET:
    case SupportedChainId.RINKEBY:
    case SupportedChainId.ROPSTEN:
    case SupportedChainId.KOVAN:
    case SupportedChainId.GOERLI:
      return [INFURA_NETWORK_URLS[chainId]]
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
    default:
  }
  // Our API-keyed URLs will fail security checks when used with external wallets.
  throw new Error('RPC URLs must use public endpoints')
}

export async function switchToNetwork(connector: Connector, chainId: SupportedChainId): Promise<null | void> {
  const info = CHAIN_INFO[chainId]
  connector.activate({
    chainId,
    chainName: info.label,
    rpcUrls: getRpcUrls(chainId),
    nativeCurrency: info.nativeCurrency,
    blockExplorerUrls: [info.explorer],
  } as AddEthereumChainParameter)
}
