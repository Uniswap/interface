import type { Input } from '@universe/mycelium'
import { type RefObject, useEffect } from 'react'
import { isInAppBrowser } from '~/utils/isInAppBrowser'

// Threshold guards against sub-pixel rounding between innerHeight (integer) and vv.height (double)
const KEYBOARD_INSET_PX = 100

interface UseScrollInputIntoViewParams {
  inputRef: RefObject<Input | null>
  enabled: boolean
}

/**
 * Scrolls a focused field into the visual viewport when the default browser behavior fails to do so
 * (e.g., an in-app browser's WebView overlays the keyboard and skips native focus-scroll)
 */
export function useScrollInputIntoView({ inputRef, enabled }: UseScrollInputIntoViewParams): void {
  useEffect(() => {
    const input = inputRef.current
    const vv = window.visualViewport

    if (!enabled || !isInAppBrowser() || !(input instanceof HTMLElement) || !vv) {
      return undefined
    }

    const onKeyboardViewportResize = (): void => {
      // Overlay keyboard shrinks visualViewport.height; layout innerHeight stays full.
      if (window.innerHeight - vv.height > KEYBOARD_INSET_PX) {
        input.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
      }
    }

    const onFocus = (): void => {
      vv.addEventListener('resize', onKeyboardViewportResize)
      onKeyboardViewportResize()
    }

    const onBlur = (): void => {
      vv.removeEventListener('resize', onKeyboardViewportResize)
    }

    input.addEventListener('focus', onFocus)
    input.addEventListener('blur', onBlur)
    if (document.activeElement === input) {
      onFocus()
    }
    return () => {
      input.removeEventListener('focus', onFocus)
      input.removeEventListener('blur', onBlur)
      vv.removeEventListener('resize', onKeyboardViewportResize)
    }
  }, [enabled, inputRef])
}
