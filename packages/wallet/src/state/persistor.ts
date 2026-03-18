import type { Persistor } from 'redux-persist'

let persistor: Persistor | undefined

export function setReduxPersistor(newPersistor: Persistor): void {
  if (persistor) {
    throw new Error('Invalid call to `setReduxPersistor` when persistor has already been initialized')
  }
  persistor = newPersistor
}

export function getReduxPersistor(): Persistor {
  if (!persistor) {
    throw new Error('Invalid call to `getReduxPersistor` before persistor has been initialized')
  }
  return persistor
}
