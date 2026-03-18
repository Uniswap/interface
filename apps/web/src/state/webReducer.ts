import { combineReducers } from '@reduxjs/toolkit'
import { uniswapPersistedStateList, uniswapReducers } from 'uniswap/src/state/uniswapReducer'
import application from '~/state/application/reducer'
import fiatOnRampTransactions from '~/state/fiatOnRampTransactions/reducer'
import lists from '~/state/lists/reducer'
import logs from '~/state/logs/slice'
import { routingApi } from '~/state/routing/slice'
import { monitoredSagaReducers } from '~/state/sagas/root'
import user from '~/state/user/reducer'
import walletCapabilities from '~/state/walletCapabilities/reducer'

const interfaceReducers = {
  ...uniswapReducers,
  user,
  lists,
  fiatOnRampTransactions,
  application,
  walletCapabilities,
  logs,
  saga: monitoredSagaReducers,
  [routingApi.reducerPath]: routingApi.reducer,
} as const

export const interfaceReducer = combineReducers(interfaceReducers)

export const interfacePersistedStateList: Array<keyof typeof interfaceReducers> = [
  ...uniswapPersistedStateList,
  'user',
  'lists',
  'fiatOnRampTransactions',
  'walletCapabilities',
]

export type InterfaceState = ReturnType<typeof interfaceReducer>
