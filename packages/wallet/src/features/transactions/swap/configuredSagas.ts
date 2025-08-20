import { getSharedTransactionSagaDependencies } from 'wallet/src/features/transactions/configuredSagas'
import { createExecuteSwapSaga } from 'wallet/src/features/transactions/swap/executeSwapSaga'
import { createPrepareAndSignSwapSaga } from 'wallet/src/features/transactions/swap/prepareAndSignSwapSaga'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

// Create configured saga instances using dependency injection
export const configuredPrepareAndSignSwapSaga = createPrepareAndSignSwapSaga(getSharedTransactionSagaDependencies())
export const configuredExecuteSwapSaga = createExecuteSwapSaga(
  getSharedTransactionSagaDependencies(),
  configuredPrepareAndSignSwapSaga,
)

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
