import { combineReducers } from '@reduxjs/toolkit'
import { monitoredSagaReducers } from 'src/app/rootSaga'
import { balancesReducer } from 'src/features/balances/balancesSlice'
import { blocksReducer } from 'src/features/blocks/blocksSlice'
import { chainsReducer } from 'src/features/chains/chainsSlice'
import { multicall } from 'src/features/multicall'
import { notificationReducer } from 'src/features/notifications/notificationSlice'
import { providersReducer } from 'src/features/providers/providerSlice'
import { tokenListsReducer } from 'src/features/tokenLists/reducer'
import { tokensReducer } from 'src/features/tokens/tokensSlice'
import { transactionReducer } from 'src/features/transactions/slice'
import { walletReducer } from 'src/features/wallet/walletSlice'

export const rootReducer = combineReducers({
  balances: balancesReducer,
  blocks: blocksReducer,
  chains: chainsReducer,
  notifications: notificationReducer,
  providers: providersReducer,
  tokenLists: tokenListsReducer,
  tokens: tokensReducer,
  transactions: transactionReducer,
  wallet: walletReducer,
  [multicall.reducerPath]: multicall.reducer,
  saga: monitoredSagaReducers,
})

export type RootState = ReturnType<typeof rootReducer>
