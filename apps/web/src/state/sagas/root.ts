import { call, spawn } from 'typed-redux-saga'
import {
  planActions,
  planReducer,
  planSagaName,
  planWrappedSaga,
} from 'uniswap/src/features/transactions/swap/plan/planSaga'
import { getMonitoredSagaReducers, type MonitoredSaga, waitForRehydration } from 'uniswap/src/utils/saga'
import { liquiditySaga } from '~/state/sagas/liquidity/liquiditySaga'
import { lpIncentivesClaimSaga } from '~/state/sagas/lp_incentives/lpIncentivesSaga'
import { submitToucanBidSaga } from '~/state/sagas/toucan/submitBidSaga'
import { withdrawBidAndClaimTokensToucanBidSaga } from '~/state/sagas/toucan/withdrawBidAndClaimTokensSaga'
import { cancelOrderSaga } from '~/state/sagas/transactions/cancelOrderSaga'
import { cancelPlanStepSaga } from '~/state/sagas/transactions/cancelPlanStepSaga'
import { swapActions, swapReducer, swapSaga, swapSagaName } from '~/state/sagas/transactions/swapSaga'
import { watchTransactionsSaga } from '~/state/sagas/transactions/watcherSaga'
import { wrapSaga } from '~/state/sagas/transactions/wrapSaga'

const sagas = [
  wrapSaga,
  liquiditySaga,
  watchTransactionsSaga,
  lpIncentivesClaimSaga,
  submitToucanBidSaga,
  withdrawBidAndClaimTokensToucanBidSaga,
]

// Stateful sagas that are registered with the store on startup
const monitoredSagas: Record<string, MonitoredSaga> = {
  [swapSagaName]: {
    name: swapSagaName,
    wrappedSaga: swapSaga,
    reducer: swapReducer,
    actions: swapActions,
  },
  [planSagaName]: {
    name: planSagaName,
    wrappedSaga: planWrappedSaga,
    reducer: planReducer,
    actions: planActions,
  },
}
export const monitoredSagaReducers = getMonitoredSagaReducers(monitoredSagas)

export const sagaTriggerActions = [
  ...Object.values(monitoredSagas).map((saga) => saga.actions.trigger.type),
  ...sagas.map((saga) => saga.actions.trigger.type),
]

export function* rootWebSaga() {
  // wait until redux-persist has finished rehydration
  yield* call(waitForRehydration)

  for (const monitored of Object.values(monitoredSagas)) {
    yield* spawn(monitored.wrappedSaga)
  }

  for (const saga of sagas) {
    yield* spawn(saga.wrappedSaga)
  }

  // Spawn sagas that listen to external Redux actions (not trigger-based)
  // These sagas don't use createSaga wrapper and are spawned directly
  yield* spawn(cancelOrderSaga)
  yield* spawn(cancelPlanStepSaga)
}
