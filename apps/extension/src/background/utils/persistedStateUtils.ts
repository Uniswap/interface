import { isOnboardedSelector } from 'src/app/utils/isOnboardedSelector'
import { STATE_STORAGE_KEY } from 'src/store/constants'
import { ExtensionState } from 'src/store/extensionReducer'
import { readDeprecatedReduxedChromeStorage } from 'src/store/reduxedChromeStorageToReduxPersistMigration'

export async function readReduxStateFromStorage(storageChanges?: {
  [key: string]: chrome.storage.StorageChange
}): Promise<ExtensionState | undefined> {
  const root = storageChanges
    ? storageChanges[STATE_STORAGE_KEY]?.newValue
    : (await chrome.storage.local.get(STATE_STORAGE_KEY))[STATE_STORAGE_KEY]

  if (!root) {
    return undefined
  }

  const rootParsed = JSON.parse(root)

  Object.keys(rootParsed).forEach((key) => {
    // Each reducer must be parsed individually.
    rootParsed[key] = JSON.parse(rootParsed[key])
  })

  return rootParsed as ExtensionState
}

export async function readIsOnboardedFromStorage(): Promise<boolean> {
  // The migration will happen in the sidebar, not in the background script,
  // because the background script never persists the state (only reads it).
  // So we need to check both the old and new storage keys to avoid the onboarding
  // flow re-opening the first time the migration needs to run.
  const [oldReduxedChromeStorageState, newReduxPersistState] = await Promise.all([
    readDeprecatedReduxedChromeStorage(),
    readReduxStateFromStorage(),
  ])

  const state = oldReduxedChromeStorageState ?? newReduxPersistState
  return state ? isOnboardedSelector(state) : false
}
