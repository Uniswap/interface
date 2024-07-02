import { useEffect } from 'react'

export enum KeyAction {
  UP = 'keyup',
  DOWN = 'keydown',
}

export const useKeyPress = ({
  callback,
  keys,
  keyAction,
  disabled,
  preventDefault,
}: {
  callback: (e: KeyboardEvent) => void
  keys?: string[]
  keyAction?: KeyAction
  disabled?: boolean
  preventDefault?: boolean
}) => {
  useEffect(() => {
    if (!keys || disabled) {
      return
    }
    const onKeyPress = (event: any) => {
      const wasAnyKeyPressed = keys.some((key) => event.key === key)
      if (wasAnyKeyPressed) {
        if (preventDefault) {
          event.preventDefault()
        }
        callback(event)
      }
    }
    const keyActionType = keyAction || KeyAction.DOWN
    document.addEventListener(keyActionType, onKeyPress)
    return () => {
      document.removeEventListener(keyActionType, onKeyPress)
    }
  }, [callback, keys, keyAction, disabled, preventDefault])
}

// Example usage:
// useKeyPress({
//   callback: someCallback,
//   keys: ['Escape'],
//   keyAction: KeyAction.UP,
// })
