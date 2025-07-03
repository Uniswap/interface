import { isOnboardedSelector } from 'src/app/utils/isOnboardedSelector'
import { STATE_STORAGE_KEY } from 'src/store/constants'
import { ExtensionState } from 'src/store/extensionReducer'

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
  const state = await readReduxStateFromStorage()
  return state ? isOnboardedSelector(state) : false
}
