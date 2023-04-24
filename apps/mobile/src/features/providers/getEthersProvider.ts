import { providers as ethersProviders } from 'ethers'
import { Config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { getInfuraChainName } from 'src/features/providers/utils'

export function getEthersProvider(
  chainId: ChainId,
  config: Readonly<Config>
): ethersProviders.JsonRpcProvider {
  return new ethersProviders.InfuraProvider(getInfuraChainName(chainId), config.infuraProjectId)
}
