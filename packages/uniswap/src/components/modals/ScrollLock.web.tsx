import { useEffect } from 'react'
import { logger } from 'utilities/src/logger/logger'

/**
 * These utils are used to lock the scroll position when a modal is open.
 * Based on https://css-tricks.com/prevent-page-scrolling-when-a-modal-is-open/
 */

let isInitialized = false
let currentScrollY = 0

export function initializeScrollWatcher(): void {
  if (isInitialized) {
    logger.warn(
      'ScrollLock.web.tsx',
      'initializeScrollWatcher',
      '`ScrollWatcher` already initialized. You should only call `initializeScrollWatcher` once.',
    )
    return
  }
  window.addEventListener('scroll', () => (currentScrollY = window.scrollY))
  isInitialized = true
}

export function updateScrollLock({ isModalOpen }: { isModalOpen: boolean }): void {
  if (!isInitialized) {
    logger.warn(
      'ScrollLock.web.tsx',
      'updateScrollLock',
      'Invalid call to `updateScrollLock` before calling `initializeScrollWatcher`',
    )
    return
  }

  if (isModalOpen) {
    const body = document.body
    body.style.position = 'fixed'
    body.style.top = `-${currentScrollY}px`
  } else {
    const body = document.body
    // The offset to restore lives only in `body.style.top`, and unlocking clears it. Without this
    // guard a second unlock reads an empty `top` and scrolls the page to 0.
    if (body.style.position !== 'fixed') {
      return
    }
    const scrollY = body.style.top
    body.style.position = ''
    body.style.top = ''
    // parseFloat: scrollY is fractional under browser zoom / high-DPI, and parseInt would drop it
    window.scrollTo(0, parseFloat(scrollY || '0') * -1)
  }
}

export function useUpdateScrollLock({ isModalOpen }: { isModalOpen: boolean }): void {
  useEffect(() => {
    if (!isModalOpen) {
      return undefined
    }
    updateScrollLock({ isModalOpen: true })
    return () => updateScrollLock({ isModalOpen: false })
  }, [isModalOpen])
}
