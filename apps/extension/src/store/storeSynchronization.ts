import { useEffect, useState } from 'react'
import { initializeReduxStore } from 'src/store/store'
import { logger } from 'utilities/src/logger/logger'
import { v4 as uuid } from 'uuid'
import { getReduxPersistor } from 'wallet/src/state/persistor'
import { PersistedStorage } from 'wallet/src/utils/persistedStorage'

/**
 * We want only one instance of the app to be persisting the redux store to disk at a time.
 * To accomplish this, we use the concept of "primary instance", which is the instance of the app that is currently being used.
 *
 * An instance of the app is the primary instance when:
 *  - It is the only instance of the app running.
 *  - There are multiple instances of the app running, and this is the instance of the sidebar that lives in the window that is currently (or was last) focused.
 *  - When there is a sidebar and an onboarding instance running on the same window, whichever is currently focused will be the primary.
 */

const PRIMARY_APP_INSTANCE_ID_KEY = 'primaryAppInstanceId'

let isPrimaryAppInstance = false
const terminate: (() => Promise<void>) | null = null

const STORAGE_NAMESPACE = 'session'
const sessionStorage = new PersistedStorage(STORAGE_NAMESPACE)
const currentAppInstanceId = uuid()

// These listeners are meant for `useIsPrimaryAppInstance()` to listen for changes.
const primaryAppInstanceListeners = new Set<(isPrimary: boolean) => void>()

export enum ExtensionAppLocation {
  SidePanel = 0,
  Tab = 1,
}

function initPrimaryInstanceHandler(appLocation: ExtensionAppLocation): void {
  initializeReduxStore()

  const onStorageChangedListener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = async (
    changes,
    namespace,
  ) => {
    if (namespace === STORAGE_NAMESPACE && changes[PRIMARY_APP_INSTANCE_ID_KEY]) {
      const wasPrimaryAppInstance = isPrimaryAppInstance
      isPrimaryAppInstance = currentAppInstanceId === changes[PRIMARY_APP_INSTANCE_ID_KEY].newValue

      if (wasPrimaryAppInstance === isPrimaryAppInstance) {
        return
      }

      const persistor = getReduxPersistor()

      if (isPrimaryAppInstance) {
        logger.debug('store-synchronization', 'chrome.storage.onChanged', 'Resuming redux persistor')

        persistor.persist()
      } else {
        logger.debug('store-synchronization', 'chrome.storage.onChanged', 'Pausing redux persistor')
        await persistor.flush()
        persistor.pause()
      }

      primaryAppInstanceListeners.forEach((listener) => listener(isPrimaryAppInstance))
    }
  }

  const onFocusChangedListener: Parameters<typeof chrome.windows.onFocusChanged.addListener>[0] = async (
    focusedWindowId,
  ) => {
    const { id: currentWindowId } = await chrome.windows.getCurrent()

    if (focusedWindowId === currentWindowId) {
      logger.debug('store-synchronization', 'chrome.windows.onFocusChanged', 'Window focused')
      await sessionStorage.setItem(PRIMARY_APP_INSTANCE_ID_KEY, currentAppInstanceId)
    }
  }

  const onWindowFocusListener: Parameters<typeof window.addEventListener>[1] = async () => {
    // We set a slight delay to ensure that the `chrome.windows.onFocusChanged` listener runs first.
    // This is to handle the case where we have a sidebar and an onboarding instance running on the same window.
    setTimeout(async () => {
      logger.debug('store-synchronization', 'window.onFocus', 'Window focused')
      await sessionStorage.setItem(PRIMARY_APP_INSTANCE_ID_KEY, currentAppInstanceId)
    }, 25)
  }

  chrome.storage.onChanged.addListener(onStorageChangedListener)

  if (appLocation === ExtensionAppLocation.SidePanel) {
    chrome.windows.onFocusChanged.addListener(onFocusChangedListener)
  }

  window.addEventListener('focus', onWindowFocusListener)

  // We always set the current app instance as the primary when it first launches.
  sessionStorage.setItem(PRIMARY_APP_INSTANCE_ID_KEY, currentAppInstanceId).catch((error) => {
    logger.error(error, {
      tags: { file: 'storeSynchronization.ts', function: 'sessionStorage.setItem' },
    })
  })

  // This will be used in the onboarding flow when the user completes onboarding but the tab remains open.
  // We don't want this tab to become the primary ever again when it's focused.
  StoreSynchronization.terminate = async (): Promise<void> => {
    chrome.storage.onChanged.removeListener(onStorageChangedListener)
    chrome.windows.onFocusChanged.removeListener(onFocusChangedListener)
    window.removeEventListener('focus', onWindowFocusListener)

    const persistor = getReduxPersistor()
    await persistor.flush()
    persistor.pause()

    isPrimaryAppInstance = false
    primaryAppInstanceListeners.forEach((listener) => listener(isPrimaryAppInstance))
  }
}

export function useIsPrimaryAppInstance(): boolean {
  const [isPrimary, setIsPrimary] = useState(isPrimaryAppInstance)

  useEffect(() => {
    const listener = (_isPrimary: boolean): void => {
      setIsPrimary(_isPrimary)
    }

    primaryAppInstanceListeners.add(listener)

    return () => {
      primaryAppInstanceListeners.delete(listener)
    }
  }, [])

  return isPrimary
}

export function terminateStoreSynchronization(): void {
  StoreSynchronization.terminate?.().catch((error) => {
    logger.error(error, {
      tags: { file: 'storeSynchronization.ts', function: 'useTerminateStoreSynchronization' },
    })
  })
}

export const StoreSynchronization: {
  init: typeof initPrimaryInstanceHandler
  terminate: (() => Promise<void>) | null
} = {
  init: initPrimaryInstanceHandler,
  terminate,
}
