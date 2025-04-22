import { PersistState } from 'redux-persist'
import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { swapSaga } from 'state/sagas/transactions/swapSaga'
import { watchTransactionsSaga } from 'state/sagas/transactions/watcherSaga'
import { wrapSaga } from 'state/sagas/transactions/wrapSaga'
import { delay, select, spawn } from 'typed-redux-saga'

const sagas = [swapSaga.wrappedSaga, wrapSaga.wrappedSaga, liquiditySaga.wrappedSaga, watchTransactionsSaga.wrappedSaga]

export function* rootWebSaga() {
  // wait until redux-persist has finished rehydration
  while (true) {
    if (yield* select((state: { _persist?: PersistState }): boolean | undefined => state._persist?.rehydrated)) {
      break
    }
    yield* delay(/* REHYDRATION_STATUS_POLLING_INTERVAL */ 50)
  }

  for (const wrappedSaga of sagas) {
    yield* spawn(wrappedSaga)
  }
}
