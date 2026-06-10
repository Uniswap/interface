import { isWebAndroid } from '@universe/environment'
import { useEffect } from 'react'

const INTERACTIVE_WIDGET_RESIZES_CONTENT = 'interactive-widget=resizes-content'

/**
 * Keeps a `position: fixed` bottom sheet on-screen when the Android soft keyboard opens.
 *
 * Android Chrome defaults to `interactive-widget=resizes-visual`: opening the keyboard leaves the
 * layout viewport (and `window.innerHeight`) full-height and instead pans the *visual* viewport.
 * Tamagui sheets render inside a `position: fixed` portal anchored to the layout viewport, so they
 * don't follow that pan and get shoved above the visible area. (Measured on a Pixel emulator: opening
 * the keyboard set `visualViewport.offsetTop` to ~the keyboard height while the sheet stayed put.)
 *
 * While `enabled`, switch the document viewport to `interactive-widget=resizes-content` so the layout
 * viewport shrinks with the keyboard and the sheet re-anchors just above it; the previous value is
 * restored on close. Scoped on purpose — it only affects keyboard behavior while this modal is open.
 *
 * No-op anywhere except Android web: iOS Safari and desktop Chromium ignore `interactive-widget`.
 */
export function useAndroidKeyboardViewportFix(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isWebAndroid) {
      return undefined
    }

    const meta = document.querySelector('meta[name="viewport"]')
    if (!meta) {
      return undefined
    }

    const previousContent = meta.getAttribute('content') ?? ''
    // Force `interactive-widget=resizes-content`, stripping any existing `interactive-widget` token so
    // we never leave a conflicting/duplicate declaration and the fix still applies even if the global
    // viewport meta later ships a different `interactive-widget` value.
    const base = previousContent
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && !part.startsWith('interactive-widget'))
      .join(', ')
    meta.setAttribute(
      'content',
      base ? `${base}, ${INTERACTIVE_WIDGET_RESIZES_CONTENT}` : INTERACTIVE_WIDGET_RESIZES_CONTENT,
    )

    return () => {
      meta.setAttribute('content', previousContent)
    }
  }, [enabled])
}
