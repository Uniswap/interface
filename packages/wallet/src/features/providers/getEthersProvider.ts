import { providers as ethersProviders } from 'ethers'
import { Config } from 'wallet/src/config'
import { ChainId } from 'wallet/src/constants/chains'
import { getInfuraChainName } from 'wallet/src/features/providers/utils'

export function getEthersProvider(
  chainId: ChainId,
  config: Readonly<Config>
): ethersProviders.JsonRpcProvider {
  return new ethersProviders.InfuraProvider(getInfuraChainName(chainId), config.infuraProjectId)
}
