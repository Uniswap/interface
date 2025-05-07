import { useEffect } from 'react'

export enum KeyAction {
  UP = 'keyup',
  DOWN = 'keydown',
}

export const useKeyDown = ({
  callback,
  keys,
  keyAction,
  disabled,
  preventDefault,
  shouldTriggerInInput = false,
}: {
  callback: (e: KeyboardEvent) => void
  keys?: string[]
  keyAction?: KeyAction
  disabled?: boolean
  preventDefault?: boolean
  shouldTriggerInInput?: boolean
}) => {
  useEffect(() => {
    if (!keys || disabled) {
      return undefined
    }
    const onKeyDown = (event: any) => {
      const wasAnyKeyPressed = keys.some((key) => event.key === key)
      // Do not prevent default if the target element is an input
      const targetWasNotAnInput = !['input', 'textarea'].includes(event.target.tagName.toLowerCase())
      const shouldTrigger = wasAnyKeyPressed && (targetWasNotAnInput || shouldTriggerInInput)

      if (shouldTrigger) {
        if (preventDefault) {
          event.preventDefault()
        }
        callback(event)
      }
    }
    const keyActionType = keyAction || KeyAction.DOWN
    document.addEventListener(keyActionType, onKeyDown)
    return () => {
      document.removeEventListener(keyActionType, onKeyDown)
    }
  }, [callback, keys, keyAction, disabled, preventDefault, shouldTriggerInInput])
}

// Example usage:
// useKeyPress({
//   callback: someCallback,
//   keys: ['Escape'],
//   keyAction: KeyAction.UP,
// })
