import { configureStore } from '@reduxjs/toolkit'
import multicall from 'lib/state/multicall'
import application from 'state/application/reducer'
import burn from 'state/burn/reducer'
import burnV3 from 'state/burn/v3/reducer'
import connection from 'state/connection/reducer'
import lists from 'state/lists/reducer'
import logs from 'state/logs/slice'
import mint from 'state/mint/reducer'
import mintV3 from 'state/mint/v3/reducer'
import { routingApi } from 'state/routing/slice'
import swap from 'state/swap/reducer'
import transactions from 'state/transactions/reducer'
import user from 'state/user/reducer'
import wallets from 'state/wallets/reducer'

const defaultReducer = {
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

export const createTestStore = (reducer = defaultReducer) =>
  configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: true }).concat(routingApi.middleware),
  })
