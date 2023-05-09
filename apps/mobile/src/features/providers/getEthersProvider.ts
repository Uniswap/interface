import { providers as ethersProviders } from 'ethers'
import { getInfuraChainName } from 'src/features/providers/utils'
import { Config } from 'wallet/src/config'
import { ChainId } from 'wallet/src/constants/chains'

export function getEthersProvider(
  chainId: ChainId,
  config: Readonly<Config>
): ethersProviders.JsonRpcProvider {
  return new ethersProviders.InfuraProvider(getInfuraChainName(chainId), config.infuraProjectId)
}
