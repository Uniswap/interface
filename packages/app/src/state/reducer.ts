import { combineReducers } from 'redux'
import { chainsReducer } from '../features/chains/slice'
import { providersReducer } from '../features/providers'
import { walletReducer } from '../features/wallet/slice'

const reducers = {
  chains: chainsReducer,
  providers: providersReducer,
  wallet: walletReducer,
} as const
export const reducer = combineReducers(reducers)
