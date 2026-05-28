import { call, fork, join } from 'typed-redux-saga'
import { ALL_EVM_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { ProviderManager } from 'wallet/src/features/providers/ProviderManager'
import { getProviderManager } from 'wallet/src/features/wallet/context'

// Initialize Ethers providers for the chains the wallet interacts with
// oxlint-disable-next-line typescript/explicit-function-return-type
export function* initProviders() {
  logger.debug('providerSaga', 'initProviders', 'Initializing providers')
  const providerManager = yield* call(getProviderManager)
  const initTasks = []

  // ProviderManager (ethers) is eagerly populated here because `getProvider`
  // reads from its cache. ViemClientManager intentionally re-resolves rpc
  // config on every `getViemClient` call (so the UniRPC flag toggling mid-
  // session is reflected immediately), so there's no equivalent warm-up
  // step for viem clients — the first read constructs as needed.
  for (const chainId of ALL_EVM_CHAIN_IDS) {
    const task = yield* fork(initProvider, { chainId, providerManager })
    initTasks.push(task)
  }
  logger.debug('providerSaga', 'initProviders', 'Waiting for provider')
  yield* join(initTasks)
  logger.debug('providerSaga', 'initProviders', 'Providers ready')
}

// oxlint-disable-next-line typescript/explicit-function-return-type
function* initProvider({ chainId, providerManager }: { chainId: UniverseChainId; providerManager: ProviderManager }) {
  try {
    logger.debug('providerSaga', 'initProvider', 'Creating a provider for:', chainId)
    yield* call([providerManager, providerManager.createProvider], chainId)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'providers/saga', function: 'initProvider' },
      extra: { chainId },
    })
  }
}
