import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { getChromeWithThrow } from 'utilities/src/chrome/chrome'
import { logger } from 'utilities/src/logger/logger'
import { isExtension } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export function useIsChromeWindowFocused(): boolean {
  const [isFocused, setIsFocused] = useState(true)

  const focusMutation = useMutation({
    mutationFn: async () => {
      if (!isExtension) {
        // This hook is ignored and always returns the default value of `true` when not in the Extension.
        return undefined
      }

      const onFocusChangedListener = async (): Promise<void> => {
        const { focused } = await chrome.windows.getCurrent()
        setIsFocused(focused)
      }

      // We run this on first render to get the initial state.
      await onFocusChangedListener()

      const chrome = getChromeWithThrow()
      chrome.windows.onFocusChanged.addListener(onFocusChangedListener)

      return () => {
        chrome.windows.onFocusChanged.removeListener(onFocusChangedListener)
      }
    },
    onError: (error: unknown) => {
      logger.error(error, {
        tags: {
          file: 'useIsChromeWindowFocused',
          function: 'useIsChromeWindowFocused',
        },
      })
    },
  })

  const focusEvent = useEvent(focusMutation.mutate)

  useEffect(() => {
    focusEvent()
  }, [focusEvent])

  return isFocused
}

export function useIsChromeWindowFocusedWithTimeout(timeoutInMs: number): boolean {
  const [isFocusedWithTimeout, setIsFocusedWithTimeout] = useState(true)

  const isFocused = useIsChromeWindowFocused()

  useEffect(() => {
    if (isFocused) {
      setIsFocusedWithTimeout(true)
      return undefined
    }

    const timeout = setTimeout(() => setIsFocusedWithTimeout(false), timeoutInMs)
    return () => clearTimeout(timeout)
  }, [isFocused, timeoutInMs])

  return isFocusedWithTimeout
}
