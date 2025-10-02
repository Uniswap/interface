import { useEffect, useRef } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const WARNING_TIMEOUT_MS = ONE_SECOND_MS * 3

export const useTemporaryExactOutputUnavailableWarning = (): {
  showExactOutputUnavailableWarning: boolean
  showTemporaryExactOutputUnavailableWarning: () => void
} => {
  const {
    value: showExactOutputUnavailableWarning,
    setTrue: handleShowWarning,
    setFalse: handleHideWarning,
  } = useBooleanState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClearTimeout = useEvent(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  })

  const showTemporaryExactOutputUnavailableWarning = useEvent(() => {
    if (timeoutRef.current) {
      handleClearTimeout()
    }

    handleShowWarning()

    timeoutRef.current = setTimeout(() => {
      handleHideWarning()
      timeoutRef.current = null
    }, WARNING_TIMEOUT_MS)
  })

  // This is to ensure that the timeout is cleared when the component unmounts.
  useEffect(() => handleClearTimeout, [handleClearTimeout])

  return { showExactOutputUnavailableWarning, showTemporaryExactOutputUnavailableWarning }
}
