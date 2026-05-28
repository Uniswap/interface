import { useEffect, useState } from 'react'

const useIsKeyboardOpen = (minKeyboardHeight = 300): boolean => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    const listener = (): void => {
      if (!window.visualViewport) {
        return
      }
      const newState = window.screen.height - minKeyboardHeight > window.visualViewport.height
      setIsKeyboardOpen(newState)
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', listener)
    }
    return (): void => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', listener)
      }
    }
  }, [minKeyboardHeight])

  return isKeyboardOpen
}

export default useIsKeyboardOpen
