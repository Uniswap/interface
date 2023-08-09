import { PayloadAction } from '@reduxjs/toolkit'
import { providers as ethersProviders } from 'ethers'
import { REHYDRATE } from 'redux-persist'
import { call, fork, join, take, takeEvery } from 'typed-redux-saga'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { ACTIVE_CHAINS, ChainId } from 'wallet/src/constants/chains'
import { setChainActiveStatus } from 'wallet/src/features/chains/slice'
import { getSortedActiveChainIds } from 'wallet/src/features/chains/utils'
import { ProviderManager } from 'wallet/src/features/providers/ProviderManager'
import { getProviderManager } from 'wallet/src/features/wallet/context'
import { RootState } from 'wallet/src/state'

// Initialize Ethers providers for the chains the wallet interacts with
export function* initProviders() {
  // Wait for rehydration so we know which networks are enabled
  const persisted = yield* take<PayloadAction<RootState>>(REHYDRATE)
  const chains = persisted.payload?.chains?.byChainId ?? ACTIVE_CHAINS
  const activeChains = getSortedActiveChainIds(chains)

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
  yield* takeEvery(setChainActiveStatus.type, modifyProviders)
}

function* initProvider(chainId: ChainId, manager: ProviderManager) {
  try {
    logger.debug('providerSaga', 'initProvider', 'Creating a provider for:', chainId)
    if (manager.hasProvider(chainId)) {
      logger.debug('providerSaga', 'initProvider', 'Provider already exists for:', chainId)
      return
    }
    yield* call(createProvider, chainId, manager)
  } catch (error) {
    logger.error('Failed to initialize provider', {
      tags: {
        file: 'providers/saga',
        function: 'initProvider',
        chainId,
        error: serializeError(error),
      },
    })
  }
}

function destroyProvider(chainId: ChainId, manager: ProviderManager): void {
  logger.debug('providerSaga', 'destroyProvider', 'Disabling a provider for:', chainId)
  if (!manager.hasProvider(chainId)) {
    logger.debug('providerSaga', 'destroyProvider', 'Provider does not exists for:', chainId)
    return
  }
  manager.removeProvider(chainId)
}

function* modifyProviders(action: PayloadAction<{ chainId: ChainId; isActive: boolean }>) {
  const { chainId, isActive } = action.payload
  try {
    const manager = yield* call(getProviderManager)
    if (isActive) {
      yield* call(initProvider, chainId, manager)
    } else {
      destroyProvider(chainId, manager)
    }
  } catch (error) {
    logger.error('Error while modifying provider', {
      tags: {
        file: 'providers/saga',
        function: 'modifyProviders',
        chainId,
        error: serializeError(error),
      },
    })
  }
}

async function createProvider(
  chainId: ChainId,
  manager: ProviderManager
): Promise<ethersProviders.Provider> {
  logger.debug('providerSaga', 'createProvider', 'Creating a provider for:', chainId)
  const provider = manager.createProvider(chainId)
  return provider
}
