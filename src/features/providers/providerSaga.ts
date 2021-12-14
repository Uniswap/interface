import { PayloadAction } from '@reduxjs/toolkit'
import { getWalletProviders } from 'src/app/walletContext'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { blockChannelWatcher, createBlockChannel } from 'src/features/blocks/blockListeners'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { initialized } from 'src/features/providers/providerSlice'
import { logger } from 'src/utils/logger'
import { call, cancel, fork, join, put, takeEvery } from 'typed-redux-saga'

// Initialize Ethers providers for the chains the wallet interacts with
export function* initProviders() {
  // Wait for rehydration so we know which networks are enabled
  // const persisted = yield* take<PayloadAction<RootState>>(REHYDRATE)
  // const chains = persisted.payload?.chains?.byChainId
  // const activeChains = getSortedActiveChainIds(chains)

  // TODO ^: Like in /features/chains/utils, the use of dynamic chain lists is commented out
  // until multicall has better multichain support. Until then, chain sets need to be static
  // to avoid reordering mutlicall hooks calls
  const activeChains = config.activeChains

  logger.debug('providerSaga', 'initProviders', 'Initializing providers')
  const manager = yield* call(getWalletProviders)
  const initTasks = []
  for (const chainId of activeChains) {
    const task = yield* fork(initProvider, chainId, manager)
    initTasks.push(task)
  }
  yield* join(initTasks)
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
    const provider = yield* call(createProvider, chainId, manager)
    const blockChannel = createBlockChannel(provider, chainId)
    const blockWatcher = yield* fork(blockChannelWatcher, blockChannel, chainId)
    manager.setProviderBlockWatcher(chainId, blockWatcher)
  } catch (error) {
    // TODO surface to UI when there's a global error modal setup
    logger.error(
      'providerSaga',
      'initProvider',
      `Error while initializing provider ${chainId}`,
      error
    )
  }
}

function* destroyProvider(chainId: ChainId, manager: ProviderManager) {
  logger.debug('providerSaga', 'destroyProvider', 'Disabling a provider for:', chainId)
  if (!manager.hasProvider(chainId)) {
    logger.debug('providerSaga', 'destroyProvider', 'Provider does not exists for:', chainId)
    return
  }
  const blockWatcher = manager.getProviderBlockWatcher(chainId)
  if (blockWatcher) {
    yield* cancel(blockWatcher)
  }
  manager.removeProvider(chainId)
}

function* modifyProviders(action: PayloadAction<{ chainId: ChainId; isActive: boolean }>) {
  const { chainId, isActive } = action.payload
  try {
    const manager = yield* call(getWalletProviders)
    if (isActive) {
      yield* call(initProvider, chainId, manager)
    } else {
      yield* call(destroyProvider, chainId, manager)
    }
  } catch (error) {
    // TODO surface to UI when there's a global error modal setup
    logger.error(
      'providerSaga',
      'modifyProviders',
      `Error while modifying provider ${chainId}`,
      error
    )
  }
}

async function createProvider(chainId: ChainId, manager: ProviderManager) {
  logger.debug('providerSaga', 'createProvider', 'Creating a provider for:', chainId)
  const provider = await manager.createProvider(chainId)
  return provider
}
