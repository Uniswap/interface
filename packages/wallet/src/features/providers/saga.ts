import { PayloadAction } from '@reduxjs/toolkit'
import { call, fork, join, takeEvery } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId } from 'wallet/src/constants/chains'
import { setChainActiveStatus } from 'wallet/src/features/chains/slice'
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
  yield* takeEvery(setChainActiveStatus.type, modifyProviders)
}

function* initProvider(chainId: ChainId, manager: ProviderManager) {
  try {
    logger.debug('providerSaga', 'initProvider', 'Creating a provider for:', chainId)
    yield* call([manager, manager.createProvider], chainId)
  } catch (error) {
    logger.error(error, { tags: { file: 'providers/saga', function: 'initProvider', chainId } })
  }
}

function* modifyProviders(action: PayloadAction<{ chainId: ChainId; isActive: boolean }>) {
  const { chainId, isActive } = action.payload
  try {
    const manager = yield* call(getProviderManager)
    if (isActive) {
      yield* call(initProvider, chainId, manager)
    } else {
      yield* call([manager, manager.removeProviders], chainId)
    }
  } catch (error) {
    logger.error(error, { tags: { file: 'providers/saga', function: 'modifyProviders', chainId } })
  }
}
