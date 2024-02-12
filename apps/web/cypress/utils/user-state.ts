import { connectionMetaKey } from '../../src/connection/meta'
import { ConnectionType } from '../../src/connection/types'
import { UserState } from '../../src/state/user/reducer'

export const CONNECTED_WALLET_USER_STATE: Partial<UserState> = {
  recentConnectionMeta: { type: ConnectionType.INJECTED },
}

export const DISCONNECTED_WALLET_USER_STATE: Partial<UserState> = { recentConnectionMeta: undefined }

/**
 * This sets the initial value of the "user" slice in IndexedDB.
 * Other persisted slices are not set, so they will be filled with their respective initial values
 * when the app runs.
 */
export function setInitialUserState(win: Cypress.AUTWindow, state: UserState) {
  // Selected wallet should also be reflected in localStorage, so that eager connections work.
  if (state.recentConnectionMeta) {
    win.localStorage.setItem(connectionMetaKey, JSON.stringify(state.recentConnectionMeta))
  }

  win.indexedDB.deleteDatabase('redux')
  const dbRequest = win.indexedDB.open('redux')
  dbRequest.onsuccess = function () {
    const db = dbRequest.result
    const transaction = db.transaction('keyvaluepairs', 'readwrite')
    const store = transaction.objectStore('keyvaluepairs')
    store.put(
      {
        user: state,
      },
      'persist:interface'
    )
  }
  dbRequest.onupgradeneeded = function () {
    const db = dbRequest.result
    db.createObjectStore('keyvaluepairs')
  }
}
