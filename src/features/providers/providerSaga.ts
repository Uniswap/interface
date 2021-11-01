import { PayloadAction } from '@reduxjs/toolkit'
import { REHYDRATE } from 'redux-persist'
import { appSelect } from 'src/app/hooks'
import { getWalletProviders } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { blockChannelWatcher, createBlockChannel } from 'src/features/blocks/blockListeners'
import { setChainActiveStatus } from 'src/features/chains/chainsSlice'
import { getActiveChainIds } from 'src/features/chains/hooks'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { logger } from 'src/utils/logger'
import { call, cancel, fork, take, takeEvery } from 'typed-redux-saga'

// Initialize Ethers providers for the chains the wallet interacts with
export function* initProviders() {
  // Wait for rehydration so we know which networks are enabled
  yield* take(REHYDRATE)

  logger.debug('Initializing providers')
  const manager = yield* call(getWalletProviders)
  const chains = yield* appSelect((s) => s.chains.byChainId)
  const activeChains = getActiveChainIds(chains)
  for (const chainId of activeChains) {
    yield* fork(initProvider, chainId, manager)
  }
  yield* takeEvery(setChainActiveStatus.type, modifyProviders)
}

function* initProvider(chainId: ChainId, manager: ProviderManager) {
  try {
    logger.debug('Creating a provider for:', chainId)
    if (manager.hasProvider(chainId)) {
      logger.debug('Provider already exists for:', chainId)
      return
    }
    const provider = yield* call(createProvider, chainId, manager)
    const blockChannel = createBlockChannel(provider, chainId)
    const blockWatcher = yield* fork(blockChannelWatcher, blockChannel, chainId)
    manager.setProviderBlockWatcher(chainId, blockWatcher)
  } catch (error) {
    // TODO surface to UI when there's a global error modal setup
    logger.error(`Error while initializing provider ${chainId}`, error)
  }
}

function* destroyProvider(chainId: ChainId, manager: ProviderManager) {
  logger.debug('Disabling a provider for:', chainId)
  if (!manager.hasProvider(chainId)) {
    logger.debug('Provider does not exists for:', chainId)
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
    logger.error(`Error while modifying provider ${chainId}`, error)
  }
}

async function createProvider(chainId: ChainId, manager: ProviderManager) {
  logger.debug('Creating a provider for:', chainId)
  const provider = await manager.createProvider(chainId)
  return provider
}
