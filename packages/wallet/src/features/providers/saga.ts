import { call, fork, join } from 'typed-redux-saga'
import { ALL_EVM_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { ProviderManager } from 'wallet/src/features/providers/ProviderManager'
import { ViemClientManager } from 'wallet/src/features/providers/ViemClientManager'
import { getProviderManager, getViemClientManager } from 'wallet/src/features/wallet/context'

// Initialize Ethers providers for the chains the wallet interacts with
export function* initProviders() {
  logger.debug('providerSaga', 'initProviders', 'Initializing providers')
  const providerManager = yield* call(getProviderManager)
  const viemClientManager = yield* call(getViemClientManager)
  const initTasks = []

  // TODO(SWAP-150): replace with `const { chains: enabledEVMChainIds } = yield* call(getEnabledChainIdsSaga, Platform.EVM)`
  //                 once we figure out how to properly wait for statsig to be initialized within that saga..
  for (const chainId of ALL_EVM_CHAIN_IDS) {
    const task = yield* fork(initProvider, { chainId, providerManager, viemClientManager })
    initTasks.push(task)
  }
  logger.debug('providerSaga', 'initProviders', 'Waiting for provider')
  yield* join(initTasks)
  logger.debug('providerSaga', 'initProviders', 'Providers ready')
}

function* initProvider({
  chainId,
  providerManager,
  viemClientManager,
}: {
  chainId: UniverseChainId
  providerManager: ProviderManager
  viemClientManager: ViemClientManager
}) {
  try {
    logger.debug('providerSaga', 'initProvider', 'Creating a provider for:', chainId)
    yield* call([providerManager, providerManager.createProvider], chainId)
    yield* call([viemClientManager, viemClientManager.createViemClient], chainId)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'providers/saga', function: 'initProvider' },
      extra: { chainId },
    })
  }
}
