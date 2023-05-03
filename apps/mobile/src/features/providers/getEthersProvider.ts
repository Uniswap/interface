import { providers as ethersProviders } from 'ethers'
import { Config } from 'src/config'
import { getInfuraChainName } from 'src/features/providers/utils'
import { ChainId } from 'wallet/src/constants/chains'

export function getEthersProvider(
  chainId: ChainId,
  config: Readonly<Config>
): ethersProviders.JsonRpcProvider {
  return new ethersProviders.InfuraProvider(getInfuraChainName(chainId), config.infuraProjectId)
}
