import { combineReducers } from 'redux'
import { PersistState } from 'redux-persist'
import { timingReducer } from 'uniswap/src/features/timing/slice'
import { uniswapPersistedStateList, uniswapReducers } from 'uniswap/src/state/uniswapReducer'
import { appearanceSettingsReducer } from 'wallet/src/features/appearance/slice'
import { batchedTransactionsReducer } from 'wallet/src/features/batchedTransactions/slice'
import { behaviorHistoryReducer } from 'wallet/src/features/behaviorHistory/slice'
import { telemetryReducer } from 'wallet/src/features/telemetry/slice'
import { walletReducer } from 'wallet/src/features/wallet/slice'
import { SagaState } from 'wallet/src/utils/saga'

export const walletReducers = {
  ...uniswapReducers,
  appearanceSettings: appearanceSettingsReducer,
  behaviorHistory: behaviorHistoryReducer,
  telemetry: telemetryReducer,
  timing: timingReducer,
  wallet: walletReducer,
  batchedTransactions: batchedTransactionsReducer,
} as const

// used to type RootState
export const walletRootReducer = combineReducers(walletReducers)

export const walletPersistedStateList: Array<keyof typeof walletReducers> = [
  ...uniswapPersistedStateList,
  'appearanceSettings',
  'behaviorHistory',
  'notifications',
  'telemetry',
  'wallet',
  'batchedTransactions',
]

export type WalletStateReducersOnly = ReturnType<typeof walletRootReducer>
export type WalletState = WalletStateReducersOnly & {
  saga: Record<string, SagaState>
} & { _persist?: PersistState }
