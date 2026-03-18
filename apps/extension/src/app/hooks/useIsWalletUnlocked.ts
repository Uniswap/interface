import { useCallback, useEffect, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { ENCRYPTION_KEY_STORAGE_KEY, PersistedStorage } from 'wallet/src/utils/persistedStorage'

/**
 * In order to speed up the initial load of the app and avoid a half a second loading spinner every time the sidebar opens,
 * we will first do a quick light check to see if the wallet *might* be unlocked by simply checking if the encryption key
 * exists in local storage, but without actually verifying that this key is valid.
 *
 * After the React app fully loads, we will then do a more thorough check to see if the wallet is actually unlocked.
 */

// exported to be used in saga's
export let isWalletUnlocked: boolean | null = null

const sessionStorage = new PersistedStorage('session')

sessionStorage
  .getItem(ENCRYPTION_KEY_STORAGE_KEY)
  .then((val) => {
    isWalletUnlocked = val !== undefined
  })
  .catch((err) => {
    logger.error(err, {
      tags: {
        file: 'useIsWalletUnlocked.ts',
        function: 'sessionStorage.getItem',
      },
    })
  })

export function useIsWalletUnlocked(): boolean | null {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(isWalletUnlocked)

  const checkWalletStatus = useCallback(async () => {
    isWalletUnlocked = await Keyring.isUnlocked()
    setIsUnlocked(isWalletUnlocked)
  }, [])

  useEffect(() => {
    const listener: Parameters<typeof chrome.storage.onChanged.addListener>[0] = async (changes, namespace) => {
      if (namespace === 'session' && changes[ENCRYPTION_KEY_STORAGE_KEY]) {
        await checkWalletStatus()
      }
    }

    chrome.storage.onChanged.addListener(listener)

    return () => {
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [checkWalletStatus])

  useEffect(() => {
    checkWalletStatus()
  }, [checkWalletStatus])

  return isUnlocked
}
