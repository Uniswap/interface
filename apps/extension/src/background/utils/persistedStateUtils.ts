import { isOnboardedSelector } from 'src/app/utils/isOnboardedSelector'
import { STATE_STORAGE_KEY } from 'src/store/constants'
import { ExtensionState } from 'src/store/extensionReducer'
import { EXTENSION_STATE_VERSION } from 'src/store/migrations'
import { deviceAccessTimeoutToMinutes } from 'uniswap/src/features/settings/constants'
import { logger } from 'utilities/src/logger/logger'

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

export async function readDeviceAccessTimeoutMinutesFromStorage(): Promise<number | undefined> {
  const state = await readReduxStateFromStorage()
  return state ? deviceAccessTimeoutToMinutes(state.userSettings.deviceAccessTimeout) : undefined
}

/**
 * Checks if Redux migrations are pending by comparing persisted version with current version
 * @returns true if migrations are pending and sidebar should handle the request
 */
export async function checkAreMigrationsPending(): Promise<boolean> {
  try {
    const reduxState = await readReduxStateFromStorage()
    if (!reduxState) {
      // No persisted state - let sidebar handle initialization
      return true
    }

    if (!reduxState._persist?.version) {
      // No version info - let sidebar handle initialization
      return true
    }

    // If persisted version is less than current version, migrations are pending
    return reduxState._persist.version < EXTENSION_STATE_VERSION
  } catch (error) {
    logger.error(error, {
      tags: { file: 'persistedStateUtils.ts', function: 'areMigrationsPending' },
    })
    // On error, err on the side of caution and let sidebar handle it
    return true
  }
}
