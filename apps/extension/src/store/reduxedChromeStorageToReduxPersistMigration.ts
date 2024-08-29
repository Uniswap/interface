import { ExtensionState } from 'src/store/extensionReducer'

// TODO(EXT-1028): remove this file once the migration is no longer needed.

const REDUXED_STORAGE_KEY = 'reduxed'

// These functions are used to migrate the redux state persistence from `reduxed-chrome-storage` to `redux-persist`.
// The actual migration happens when the sidebar initializes the redux store. See `initializeReduxStore` in `store.ts`.

export async function readDeprecatedReduxedChromeStorage(): Promise<ExtensionState | undefined> {
  const reduxedArray = (await chrome.storage.local.get(REDUXED_STORAGE_KEY))?.[REDUXED_STORAGE_KEY]

  if (!reduxedArray) {
    return undefined
  }

  // The `reduxed` storage is an array: [id, timestamp, state]
  const [, , state] = reduxedArray

  if (!state) {
    return undefined
  }

  return state as ExtensionState
}

export async function deleteDeprecatedReduxedChromeStorage(): Promise<void> {
  await chrome.storage.local.remove(REDUXED_STORAGE_KEY)
}
