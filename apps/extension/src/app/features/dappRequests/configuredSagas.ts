import { createPrepareAndSignDappTransactionSaga } from 'src/app/features/dappRequests/sagas/prepareAndSignDappTransactionSaga'
import { getSharedTransactionSagaDependencies } from 'wallet/src/features/transactions/configuredSagas'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

// Create configured saga instance using shared transaction dependencies
const configuredPrepareAndSignDappTransactionSaga = createPrepareAndSignDappTransactionSaga(
  getSharedTransactionSagaDependencies(),
)

// Export the monitored saga
export const {
  name: prepareAndSignDappTransactionSagaName,
  wrappedSaga: prepareAndSignDappTransactionSaga,
  reducer: prepareAndSignDappTransactionReducer,
  actions: prepareAndSignDappTransactionActions,
} = createMonitoredSaga({
  saga: configuredPrepareAndSignDappTransactionSaga,
  name: 'prepareAndSignDappTransaction',
})
