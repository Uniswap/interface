import { useEffect, useState } from 'react'
import { getChromeWithThrow } from 'utilities/src/chrome/chrome'
import { logger } from 'utilities/src/logger/logger'
import { isExtensionApp } from 'utilities/src/platform'

export function useIsChromeWindowFocused(): boolean {
  const [isFocused, setIsFocused] = useState(true)

  useEffect(() => {
    if (!isExtensionApp) {
      return undefined
    }

    const chrome = getChromeWithThrow()

    const onFocusChangedListener = async (): Promise<void> => {
      const { focused } = await chrome.windows.getCurrent()
      setIsFocused(focused)
    }

    // Get initial state
    onFocusChangedListener().catch((error) => {
      logger.error(error, {
        tags: {
          file: 'useIsChromeWindowFocused.ts',
          function: 'useIsChromeWindowFocused',
        },
      })
    })

    chrome.windows.onFocusChanged.addListener(onFocusChangedListener)

    // Remove listener when component unmounts
    return () => {
      chrome.windows.onFocusChanged.removeListener(onFocusChangedListener)
    }
  }, [])

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
