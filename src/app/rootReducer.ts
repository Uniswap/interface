import { combineReducers } from '@reduxjs/toolkit'
import { monitoredSagaReducers } from 'src/app/rootSaga'
import { walletReducer } from 'src/features/wallet/walletSlice'

export const rootReducer = combineReducers({
  wallet: walletReducer,
  saga: monitoredSagaReducers,
})

export type RootState = ReturnType<typeof rootReducer>
