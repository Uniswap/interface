import { call, fork, join } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId } from 'wallet/src/constants/chains'
import { ProviderManager } from 'wallet/src/features/providers/ProviderManager'
import { getProviderManager } from 'wallet/src/features/wallet/context'

// Initialize Ethers providers for the chains the wallet interacts with
export function* initProviders() {
  logger.debug('providerSaga', 'initProviders', 'Initializing providers')
  const manager = yield* call(getProviderManager)
  const initTasks = []
  for (const chainId of ALL_SUPPORTED_CHAIN_IDS) {
    const task = yield* fork(initProvider, chainId, manager)
    initTasks.push(task)
  }
  logger.debug('providerSaga', 'initProviders', 'Waiting for provider')
  yield* join(initTasks)
  logger.debug('providerSaga', 'initProviders', 'Providers ready')
}

function* initProvider(chainId: ChainId, manager: ProviderManager) {
  try {
    logger.debug('providerSaga', 'initProvider', 'Creating a provider for:', chainId)
    yield* call([manager, manager.createProvider], chainId)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'providers/saga', function: 'initProvider' },
      extra: { chainId },
    })
  }
}
