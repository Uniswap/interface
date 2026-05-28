import { createMonitoredSaga } from 'uniswap/src/utils/saga'
import { getSharedTransactionSagaDependencies } from 'wallet/src/features/transactions/configuredSagas'
import { createExecutePlanSaga } from 'wallet/src/features/transactions/swap/executePlanSaga'
import { createExecuteSwapSaga } from 'wallet/src/features/transactions/swap/executeSwapSaga'
import { createPrepareAndSignSwapSaga } from 'wallet/src/features/transactions/swap/prepareAndSignSwapSaga'

// Create configured saga instances using dependency injection
export const configuredPrepareAndSignSwapSaga = createPrepareAndSignSwapSaga(getSharedTransactionSagaDependencies())
export const configuredExecuteSwapSaga = createExecuteSwapSaga(
  getSharedTransactionSagaDependencies(),
  configuredPrepareAndSignSwapSaga,
)
export const configuredExecutePlanSaga = createExecutePlanSaga(getSharedTransactionSagaDependencies())

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

export const {
  name: executePlanSagaName,
  wrappedSaga: executePlanSaga,
  reducer: executePlanReducer,
  actions: executePlanActions,
} = createMonitoredSaga({
  saga: configuredExecutePlanSaga,
  name: 'executePlan',
  options: {
    parallel: true,
  },
})
