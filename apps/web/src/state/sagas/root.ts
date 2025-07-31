import { liquiditySaga } from 'state/sagas/liquidity/liquiditySaga'
import { lpIncentivesClaimSaga } from 'state/sagas/lp_incentives/lpIncentivesSaga'
import { swapSaga } from 'state/sagas/transactions/swapSaga'
import { watchTransactionsSaga } from 'state/sagas/transactions/watcherSaga'
import { wrapSaga } from 'state/sagas/transactions/wrapSaga'
import { call, spawn } from 'typed-redux-saga'
import { waitForRehydration } from 'uniswap/src/utils/saga'

const sagas = [
  swapSaga.wrappedSaga,
  wrapSaga.wrappedSaga,
  liquiditySaga.wrappedSaga,
  watchTransactionsSaga.wrappedSaga,
  lpIncentivesClaimSaga.wrappedSaga,
]

export function* rootWebSaga() {
  // wait until redux-persist has finished rehydration
  yield* call(waitForRehydration)

  for (const wrappedSaga of sagas) {
    yield* spawn(wrappedSaga)
  }
}
