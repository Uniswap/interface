import { fetchBalances } from 'src/features/balances/fetchBalances'
import { TransferTokenParams } from 'src/features/transfer/types'
import { logger } from 'src/utils/logger'
import { call } from 'typed-redux-saga'

export function* transferToken(params: TransferTokenParams) {
  const balances = yield* call(fetchBalances, params.from)
  logger.debug('Balances', balances)
  // TODO
}
