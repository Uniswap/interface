import { isAndroid } from '@walletconnect/utils'
import { useCallback, useEffect, useState } from 'react'
import { getCloudBackupList } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'
import { config } from 'uniswap/src/config'

type UseCloudBackup = {
  backups: CloudStorageMnemonicBackup[]
  isLoading: boolean | null
  isError: boolean
  triggerCloudStorageBackupsFetch: () => void
}

type UseCloudBackupOptions = {
  autoFetch?: boolean
}

/**
 * Workaround for Android GDrive backup. There are many UXs depending on the API and
 * at the moment we are only e2e testing seed phrase input.
 */
const ANDROID_E2E_WORKAROUND = config.isE2ETest && isAndroid

export const useCloudBackups = (options?: UseCloudBackupOptions): UseCloudBackup => {
  const [backups, setBackups] = useState<CloudStorageMnemonicBackup[]>([])
  const [isLoading, setIsLoading] = useState<boolean | null>(null)
  const [isError, setIsError] = useState(false)

  const triggerCloudStorageBackupsFetch = useCallback(() => {
    setIsError(false)
    setIsLoading(true)
    // delays native oauth consent screen to avoid UI freezes
    setTimeout(async () => {
      try {
        if (ANDROID_E2E_WORKAROUND) {
          setIsError(false)
          return
        }
        setBackups(await getCloudBackupList())
        setIsLoading(false)
      } catch (e) {
        setIsError(true)
        setIsLoading(false)
      }
    }, 0)
  }, [])

  useEffect(() => {
    if (options?.autoFetch) {
      triggerCloudStorageBackupsFetch()
    }
  }, [options?.autoFetch, triggerCloudStorageBackupsFetch])

  return {
    backups,
    isLoading,
    isError,
    triggerCloudStorageBackupsFetch,
  }
}
