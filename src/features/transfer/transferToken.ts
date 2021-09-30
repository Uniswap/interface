import { NULL_ADDRESS } from 'src/constants/accounts'
import { fetchBalances } from 'src/features/balances/fetchBalances'
import { TransferTokenParams } from 'src/features/transfer/types'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export function* transferToken(params: TransferTokenParams) {
  // TODO
  logger.debug(params)
  const balances = yield* call(fetchBalances, NULL_ADDRESS)
  logger.debug('Balances', balances)
}

export const {
  name: transferTokenSagaName,
  wrappedSaga: transferTokenSaga,
  reducer: transferTokenReducer,
  actions: transferTokenActions,
} = createMonitoredSaga<TransferTokenParams>(transferToken, 'transferToken')
