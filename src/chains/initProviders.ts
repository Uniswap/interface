import { getWalletProviders } from 'src/app/walletContext'
import { ProviderManager } from 'src/chains/ProviderManager'
import { SupportedChainId } from 'src/constants/chains'
import { logger } from 'src/utils/logger'
import { call } from 'typed-redux-saga'

// Initialize Ethers providers for the chains the wallet interacts with
// Alternative strategy could be to lazily init as they're needed, may change to that later
export function* initProviders() {
  const manager = yield* call(getWalletProviders)
  yield* call(_initProviders, manager)
}

async function _initProviders(manager: ProviderManager) {
  try {
    await manager.createProvider(SupportedChainId.GOERLI)
    await manager.createProvider(SupportedChainId.MAINNET)
  } catch (error) {
    // TODO consider surfacing to UI unless we can recover/retry somehow
    logger.error('Error while initializing providers', error)
  }
}
