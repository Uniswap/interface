import { useCallback, useEffect, useState } from 'react'
import { isExtension } from 'utilities/src/platform'
import { useAsyncData } from 'utilities/src/react/hooks'

export function useIsChromeWindowFocused(): boolean {
  const [isFocused, setIsFocused] = useState(true)

  useAsyncData(
    useCallback(async () => {
      if (!isExtension) {
        // This hook is ignored and always returns `true` when not in the Extension.
        return undefined
      }

      const onFocusChangedListener = async (): Promise<void> => {
        const { focused } = await chrome.windows.getCurrent()
        setIsFocused(focused)
      }

      // We run this on first render to get the initial state.
      await onFocusChangedListener()

      chrome.windows.onFocusChanged.addListener(onFocusChangedListener)

      return () => {
        chrome.windows.onFocusChanged.removeListener(onFocusChangedListener)
      }
    }, []),
  )

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
