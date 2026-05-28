import { useCallback, useEffect, useState } from 'react'
import { getConfig } from 'src/config'
import { getCloudBackupList } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { CloudStorageMnemonicBackup } from 'src/features/CloudBackup/types'

type UseCloudBackup = {
  backups: CloudStorageMnemonicBackup[]
  isLoading: boolean | null
  isError: boolean
  triggerCloudStorageBackupsFetch: () => void
}

type UseCloudBackupOptions = {
  autoFetch?: boolean
}

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
        if (getConfig().isE2ETest) {
          setIsLoading(false)
          setIsError(false)
          return
        }
        setBackups(await getCloudBackupList())
        setIsLoading(false)
      } catch {
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
