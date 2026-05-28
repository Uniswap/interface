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
    const scrollY = body.style.top
    body.style.position = ''
    body.style.top = ''
    window.scrollTo(0, parseInt(scrollY || '0', 10) * -1)
  }
}

export function useUpdateScrollLock({ isModalOpen }: { isModalOpen: boolean }): void {
  useEffect(() => {
    updateScrollLock({ isModalOpen })
    return () => updateScrollLock({ isModalOpen: false })
  }, [isModalOpen])
}
