import { providers as ethersProviders } from 'ethers'
import { Config } from 'wallet/src/config'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import { getInfuraChainName } from 'wallet/src/features/providers/utils'

export function getEthersProvider(
  chainId: ChainId,
  config: Readonly<Config>
): ethersProviders.JsonRpcProvider {
  return new ethersProviders.InfuraProvider(getInfuraChainName(chainId), config.infuraProjectId)
}

// For chains that are not supported by Ethers InfuraProvider (https://docs.ethers.org/v5/api/providers/api-providers/)
export function getEthersProviderFromRpcUrl(chainId: ChainId): ethersProviders.JsonRpcProvider {
  const rpcUrl = CHAIN_INFO[chainId].rpcUrls?.[0]
  return new ethersProviders.JsonRpcProvider(rpcUrl)
}
