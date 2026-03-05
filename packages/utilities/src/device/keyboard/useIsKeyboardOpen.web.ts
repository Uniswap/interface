import { useEffect, useState } from 'react'

export const useIsKeyboardOpen = (minKeyboardHeight = 300): boolean => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const checkKeyboard = (): void => {
      if (!window.visualViewport) {
        return
      }
      const heightDiff = window.screen.height - window.visualViewport.height
      setIsKeyboardOpen(heightDiff > minKeyboardHeight)
    }

    // Call immediately on mount to catch keyboards already open
    checkKeyboard()

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkKeyboard)
    }

    return (): void => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkKeyboard)
      }
    }
  }, [minKeyboardHeight])

  return isKeyboardOpen
}
