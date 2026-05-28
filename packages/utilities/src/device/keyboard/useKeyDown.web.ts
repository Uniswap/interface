import { useEffect } from 'react'
import { KeyAction, UseKeyDownProps } from 'utilities/src/device/keyboard/types'

export const useKeyDown = ({
  callback,
  keys,
  keyAction,
  disabled,
  preventDefault,
  shouldTriggerInInput = false,
}: UseKeyDownProps): void => {
  useEffect(() => {
    if (!keys || !keys.length || disabled) {
      return undefined
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      const wasAnyKeyPressed = keys.some((key) => event.key === key)
      // Do not prevent default if the target element is an input
      const targetWasNotAnInput =
        event.target instanceof HTMLElement && !['input', 'textarea'].includes(event.target.tagName.toLowerCase())
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
// useKeyDown({
//   callback: someCallback,
//   keys: ['Escape'],
//   keyAction: KeyAction.UP,
// })
