import { isMobileWeb } from '@universe/environment'
import { useEffect, useState } from 'react'

/**
 * iOS Safari body scroll lock. The standard overflow:hidden approach (used by
 * @tamagui/remove-scroll inside WebBottomSheet) doesn't stop momentum scroll,
 * so we pin the body via position:fixed and restore the scroll position on
 * cleanup.
 *
 * Also tracks the on-screen keyboard height via visualViewport so callers can
 * pad content and prevent focused-input auto-scroll from burying CTAs under
 * the keyboard.
 *
 * No-op when isMobileWeb is false. Returns the current keyboard height in px.
 */
export function useIOSBodyScrollLock(enabled: boolean): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    if (!enabled || !isMobileWeb) {
      return undefined
    }
    const body = document.body
    const scrollY = window.scrollY
    const original = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'

    const viewport = window.visualViewport
    const updateKeyboardHeight = () => {
      if (!viewport) {
        return
      }
      setKeyboardHeight(Math.max(0, Math.round(window.innerHeight - viewport.height)))
    }
    viewport?.addEventListener('resize', updateKeyboardHeight)

    return () => {
      Object.assign(body.style, original)
      window.scrollTo(0, scrollY)
      setKeyboardHeight(0)
      viewport?.removeEventListener('resize', updateKeyboardHeight)
    }
  }, [enabled])

  return keyboardHeight
}
