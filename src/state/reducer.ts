import multicall from 'lib/state/multicall'

import application from './application/reducer'
import burn from './burn/reducer'
import burnV3 from './burn/v3/reducer'
import connection from './connection/reducer'
import lists from './lists/reducer'
import logs from './logs/slice'
import mint from './mint/reducer'
import mintV3 from './mint/v3/reducer'
import { routingApi } from './routing/slice'
import swap from './swap/reducer'
import transactions from './transactions/reducer'
import user from './user/reducer'
import wallets from './wallets/reducer'

export default {
  application,
  user,
  connection,
  transactions,
  wallets,
  swap,
  mint,
  mintV3,
  burn,
  burnV3,
  multicall: multicall.reducer,
  lists,
  logs,
  [routingApi.reducerPath]: routingApi.reducer,
}
