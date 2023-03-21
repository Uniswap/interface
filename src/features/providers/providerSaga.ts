import { PayloadAction } from '@reduxjs/toolkit'
import { providers as ethersProviders } from 'ethers'
import { REHYDRATE } from 'redux-persist'
import { appSelect } from 'src/app/hooks'
import { RootState } from 'src/app/rootReducer'
import { getProviderManager } from 'src/app/walletContext'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { getSortedActiveChainIds } from 'src/features/chains/utils'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { initialized } from 'src/features/providers/providerSlice'
import { logger } from 'src/utils/logger'
import { call, fork, join, put, take, takeEvery } from 'typed-redux-saga'

// Initialize Ethers providers for the chains the wallet interacts with
export function* initProviders() {
  // Wait for rehydration so we know which networks are enabled
  const persisted = yield* take<PayloadAction<RootState>>(REHYDRATE)
  const chains = persisted.payload?.chains?.byChainId ?? config.activeChains
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
  yield* put(initialized())
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
    logger.error(
      'providerSaga',
      'initProvider',
      `Error while initializing provider ${chainId}`,
      error
    )
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
    logger.error(
      'providerSaga',
      'modifyProviders',
      `Error while modifying provider ${chainId}`,
      error
    )
  }
}

async function createProvider(
  chainId: ChainId,
  manager: ProviderManager
): Promise<ethersProviders.Provider> {
  logger.debug('providerSaga', 'createProvider', 'Creating a provider for:', chainId)
  const provider = await manager.createProvider(chainId)
  return provider
}

// Sagas can use this to delay execution until the providers have been initialized
export function* waitForProvidersInitialized() {
  const isInitialized = yield* appSelect((state) => state.providers.isInitialized)
  if (isInitialized) return
  yield* take(initialized.type)
}
