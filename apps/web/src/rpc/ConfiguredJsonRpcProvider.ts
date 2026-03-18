import { Networkish } from '@ethersproject/providers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InstrumentedJsonRpcProvider } from 'uniswap/src/features/providers/observability/InstrumentedJsonRpcProvider'
import { getRpcObserver } from 'uniswap/src/features/providers/observability/rpcObserver'
import { AVERAGE_L1_BLOCK_TIME_MS } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'

export default class ConfiguredJsonRpcProvider extends InstrumentedJsonRpcProvider {
  constructor({
    url,
    networkish,
    pollingInterval = AVERAGE_L1_BLOCK_TIME_MS,
  }: {
    url?: string
    // Including networkish allows ethers to skip the initial detectNetwork call.
    networkish: Networkish & { chainId: UniverseChainId }
    pollingInterval?: number
  }) {
    super({ url, chainIdOrNetwork: networkish, observer: getRpcObserver() })

    // NB: Third-party providers (eg MetaMask) will have their own polling intervals,
    // which should be left as-is to allow operations (eg transaction confirmation) to resolve faster.
    // Network providers need to update less frequently to be considered responsive.
    this.pollingInterval = pollingInterval
  }
}
