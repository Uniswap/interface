import { useEffect } from 'react'

export const useKeyDown = (callback: (e: KeyboardEvent) => void, keys: string[] | undefined) => {
  useEffect(() => {
    if (!keys) {
      return
    }
    const onKeyDown = (event: any) => {
      const wasAnyKeyPressed = keys.some((key) => event.key === key)
      if (wasAnyKeyPressed) {
        event.preventDefault()
        callback(event)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [callback, keys])
}

// Example usage:
// useKeyDown(() => {
//   someCallback()
// }, ['Escape'])
