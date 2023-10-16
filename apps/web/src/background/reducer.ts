import { RootReducerNames } from 'wallet/src/state/reducer'
import { PersistedStorage } from 'wallet/src/utils/persistedStorage'
import { ReducerNames } from './store'

/** Slices that are persisted across sessions in local storage. */
const whitelist: Array<ReducerNames | RootReducerNames> = ['dapp', 'wallet']

export const persistConfig = {
  key: 'root',
  storage: new PersistedStorage(),
  whitelist,
  version: 1,
  // TODO: migrate script
  // migrate: () => {}
}
