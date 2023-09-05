import { PayloadAction } from '@reduxjs/toolkit'
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
    yield* call([manager, manager.createProvider], chainId)
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
