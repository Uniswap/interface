import { isWebApp } from '@universe/environment'
import { hasStringAsync } from 'expo-clipboard'
import { useEffect, useState } from 'react'

export function useClipboardCheck(): boolean {
  const [hasClipboardString, setHasClipboardString] = useState(false)

  // Check if user clipboard has any text to show paste button
  useEffect(() => {
    // Browser doesn't have permissions to access clipboard by default
    // so it will prompt the user to allow clipboard access which is
    // quite jarring and unnecessary.
    if (isWebApp) {
      return
    }
    hasStringAsync()
      .then(setHasClipboardString)
      .catch(() => undefined)
  }, [])

  return hasClipboardString
}
