import { combineReducers } from '@reduxjs/toolkit'
import { monitoredSagaReducers } from 'src/app/rootSaga'
import { biometricSettingsReducer } from 'src/features/biometrics/slice'
import { blocksReducer } from 'src/features/blocks/blocksSlice'
import { chainsReducer } from 'src/features/chains/chainsSlice'
import { cloudBackupReducer } from 'src/features/CloudBackup/cloudBackupSlice'
import { ensApi } from 'src/features/ens/api'
import { experimentsReducer } from 'src/features/experiments/slice'
import { searchHistoryReducer } from 'src/features/explore/searchHistorySlice'
import { favoritesReducer } from 'src/features/favorites/slice'
import { gasApi } from 'src/features/gas/api'
import { modalsReducer } from 'src/features/modals/modalSlice'
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
  [multicall.reducerPath]: multicall.reducer,
  [nftApi.reducerPath]: nftApi.reducer,
  [routingApi.reducerPath]: routingApi.reducer,
  [gasApi.reducerPath]: gasApi.reducer,
  [ensApi.reducerPath]: ensApi.reducer,
  biometricSettings: biometricSettingsReducer,
  blocks: blocksReducer,
  chains: chainsReducer,
  favorites: favoritesReducer,
  modals: modalsReducer,
  notifications: notificationReducer,
  providers: providersReducer,
  saga: monitoredSagaReducers,
  searchHistory: searchHistoryReducer,
  tokenLists: tokenListsReducer,
  tokens: tokensReducer,
  transactions: transactionReducer,
  wallet: walletReducer,
  walletConnect: walletConnectReducer,
  cloudBackup: cloudBackupReducer,
  experiments: experimentsReducer,
})

export type RootState = ReturnType<typeof rootReducer>
