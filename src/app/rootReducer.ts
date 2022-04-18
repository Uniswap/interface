import { combineReducers } from '@reduxjs/toolkit'
import { monitoredSagaReducers } from 'src/app/rootSaga'
import { balancesReducer } from 'src/features/balances/balancesSlice'
import { blocksReducer } from 'src/features/blocks/blocksSlice'
import { chainsReducer } from 'src/features/chains/chainsSlice'
import { dataApi } from 'src/features/dataApi/slice'
import { favoritesReducer } from 'src/features/favorites/slice'
import { multicall } from 'src/features/multicall'
import { nftApi } from 'src/features/nfts/api'
import { notificationReducer } from 'src/features/notifications/notificationSlice'
import { providersReducer } from 'src/features/providers/providerSlice'
import { routingApi } from 'src/features/routing/routingApi'
import { tokenListsReducer } from 'src/features/tokenLists/reducer'
import { tokensReducer } from 'src/features/tokens/tokensSlice'
import { transactionReducer } from 'src/features/transactions/slice'
import { walletReducer } from 'src/features/wallet/walletSlice'
import { walletConnectReducer } from 'src/features/walletConnect/walletConnectSlice'
export const rootReducer = combineReducers({
  balances: balancesReducer,
  blocks: blocksReducer,
  chains: chainsReducer,
  favorites: favoritesReducer,
  notifications: notificationReducer,
  providers: providersReducer,
  tokenLists: tokenListsReducer,
  tokens: tokensReducer,
  transactions: transactionReducer,
  wallet: walletReducer,
  [multicall.reducerPath]: multicall.reducer,
  saga: monitoredSagaReducers,
  [dataApi.reducerPath]: dataApi.reducer,
  [nftApi.reducerPath]: nftApi.reducer,
  [routingApi.reducerPath]: routingApi.reducer,
  walletConnect: walletConnectReducer,
})

export type RootState = ReturnType<typeof rootReducer>
