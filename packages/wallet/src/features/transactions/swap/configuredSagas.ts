import { createExecuteSwapSaga } from 'wallet/src/features/transactions/swap/executeSwapSaga'
import { createSwapSagaDependencies } from 'wallet/src/features/transactions/swap/factories/createSwapSagaDependencies'
import { createPrepareAndSignSwapSaga } from 'wallet/src/features/transactions/swap/prepareAndSignSwapSaga'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

// Create default dependencies
const dependencies = createSwapSagaDependencies()

// Create configured saga instances using dependency injection
export const configuredPrepareAndSignSwapSaga = createPrepareAndSignSwapSaga(dependencies)
export const configuredExecuteSwapSaga = createExecuteSwapSaga(dependencies, configuredPrepareAndSignSwapSaga)

// Export the monitored sagas
export const {
  name: prepareAndSignSwapSagaName,
  wrappedSaga: prepareAndSignSwapSaga,
  reducer: prepareAndSignSwapReducer,
  actions: prepareAndSignSwapActions,
} = createMonitoredSaga({
  saga: configuredPrepareAndSignSwapSaga,
  name: 'prepareAndSignSwap',
})

export const {
  name: executeSwapSagaName,
  wrappedSaga: executeSwapSaga,
  reducer: executeSwapReducer,
  actions: executeSwapActions,
} = createMonitoredSaga({
  saga: configuredExecuteSwapSaga,
  name: 'executeSwap',
})
