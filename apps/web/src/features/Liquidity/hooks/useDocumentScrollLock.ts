import { useLayoutEffect } from 'react'

let lockCount = 0

/** html scroll lock for modals that opt out of Modal's built-in lock (`disableRemoveScroll`). */
export function useDocumentScrollLock(enabled: boolean): void {
  useLayoutEffect(() => {
    if (!enabled) {
      return undefined
    }
    const rootEl = document.documentElement
    if (++lockCount === 1) {
      if (rootEl.clientWidth < window.innerWidth) {
        rootEl.style.scrollbarGutter = 'stable'
      }
      rootEl.style.overflow = 'hidden'
    }
    return () => {
      // '' rather than a snapshot: restoring a stale snapshot after a non-LIFO release by
      // another lock family would leave the page permanently unscrollable.
      if (--lockCount === 0) {
        rootEl.style.overflow = ''
        rootEl.style.scrollbarGutter = ''
      }
    }
  }, [enabled])
}
