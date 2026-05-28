import { useCallback, useEffect, useState } from 'react'
import { GlobalErrorEvent } from 'src/app/events/constants'
import { globalEventEmitter } from 'src/app/events/global'
import { logger } from 'utilities/src/logger/logger'

const REMAINING_STORAGE_THRESHOLD_BYTES = 500000 // 500KB

export function useCheckLowStorage({ isOnboarding }: { isOnboarding: boolean }): {
  showStorageWarning: boolean
  onStorageWarningClose: () => void
} {
  const [hasShownWarning, setHasShownWarning] = useState(false)
  const [showStorageWarning, setShowStorageWarning] = useState(false)

  const onStorageWarningClose = useCallback(() => setShowStorageWarning(false), [])
  const triggerStorageWarning = useCallback((): void => {
    if (!hasShownWarning) {
      setShowStorageWarning(true)
      setHasShownWarning(true)
    }
  }, [hasShownWarning])

  useEffect(() => {
    if (!isOnboarding) {
      navigator.storage
        .estimate()
        .then(({ quota }) => {
          if (quota && quota < REMAINING_STORAGE_THRESHOLD_BYTES) {
            triggerStorageWarning()
            logger.info('useCheckLowStorage.ts', 'useCheckLowStorage', 'Low storage warning shown')
          }
        })
        .catch(() => {})
    }
  }, [isOnboarding, triggerStorageWarning])

  useEffect(() => {
    const listener = (): void => {
      triggerStorageWarning()
    }
    globalEventEmitter.addListener(GlobalErrorEvent.ReduxStorageExceeded, listener)
    return () => {
      globalEventEmitter.removeListener(GlobalErrorEvent.ReduxStorageExceeded, listener)
    }
  }, [triggerStorageWarning])

  return { showStorageWarning, onStorageWarningClose }
}
