// Store that tracks window.scrollY via a single scroll DOM listener.

let scrollY = typeof window !== 'undefined' ? window.scrollY : 0
let rafId: number | null = null
const listeners: Set<() => void> = new Set()

// Update scrollY only once per frame
function handleScroll(): void {
  if (rafId !== null) {
    return
  }

  rafId = requestAnimationFrame(() => {
    // When a modal opens, ScrollLock sets body.position = 'fixed' which causes
    // window.scrollY to become 0. Preserve the last known scroll position.
    const isScrollLocked = document.body.style.position === 'fixed'
    if (!isScrollLocked) {
      scrollY = window.scrollY
    }

    listeners.forEach((listener) => listener())
    rafId = null
  })
}

export function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  if (listeners.size === 0) {
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Sync initial value
    scrollY = window.scrollY
  }

  listeners.add(callback)

  return () => {
    listeners.delete(callback)

    if (listeners.size === 0) {
      window.removeEventListener('scroll', handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }
  }
}

export function getScrollY(): number {
  return scrollY
}
