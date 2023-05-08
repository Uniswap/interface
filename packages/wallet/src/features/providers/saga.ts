import { providers as ethersProviders } from 'ethers'
import { call, fork, join, put } from 'typed-redux-saga'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId } from 'wallet/src/constants/chains'

import { logger } from '../logger/logger'
import { getProviderManager } from '../wallet/context'
import { ProviderManager } from './ProviderManager'
import { initialized } from './slice'

// Initialize Ethers providers for the chains the wallet interacts with
export function* initProviders() {
  const activeChains = ALL_SUPPORTED_CHAIN_IDS

  logger.debug('providerSaga', 'initProviders', 'Initializing providers')
  const manager = yield* call(getProviderManager)
  const initTasks = []
  for (const chainId of activeChains) {
    const task = yield* fork(initProvider, chainId, manager)
    initTasks.push(task)
  }
  logger.debug('providerSaga', 'initProviders', 'Waiting for provider')
  yield* join(initTasks)
  logger.debug('providerSaga', 'initProviders', 'Providers ready')
  yield* put(initialized())
}

function* initProvider(chainId: ChainId, manager: ProviderManager) {
  try {
    logger.debug(
      'providerSaga',
      'initProvider',
      'Creating a provider for:',
      chainId
    )
    if (manager.hasProvider(chainId)) {
      logger.debug(
        'providerSaga',
        'initProvider',
        'Provider already exists for:',
        chainId
      )
      return
    }
    yield* call(createProvider, chainId, manager)
  } catch (error) {
    logger.error(
      'providerSaga',
      'initProvider',
      `Error while initializing provider ${chainId}`,
      error
    )
  }
}

async function createProvider(
  chainId: ChainId,
  manager: ProviderManager
): Promise<ethersProviders.Provider> {
  logger.debug(
    'providerSaga',
    'createProvider',
    'Creating a provider for:',
    chainId
  )
  const provider = manager.createProvider(chainId)
  return provider
}
