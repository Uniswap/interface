import { Networkish } from '@ethersproject/networks'
import { StaticJsonRpcProvider } from '@ethersproject/providers'

import { SupportedInterfaceChain } from 'constants/chains'
import { AVERAGE_L1_BLOCK_TIME } from '../constants/chainInfo'

export default class ConfiguredJsonRpcProvider extends StaticJsonRpcProvider {
  constructor(
    url: string | undefined,
    // Including networkish allows ethers to skip the initial detectNetwork call.
    networkish: Networkish & { chainId: SupportedInterfaceChain },
    pollingInterval = AVERAGE_L1_BLOCK_TIME
  ) {
    super(url, networkish)

    // NB: Third-party providers (eg MetaMask) will have their own polling intervals,
    // which should be left as-is to allow operations (eg transaction confirmation) to resolve faster.
    // Network providers need to update less frequently to be considered responsive.
    this.pollingInterval = pollingInterval
  }
}
