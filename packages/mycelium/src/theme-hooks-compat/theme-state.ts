/**
 * Web theme source for the compat theme hooks: the active theme is the
 * `light`/`dark` class on `<html>` — the `@universe/tailwind` variables.css
 * convention, maintained by the app's theme provider. Exposed as a
 * `useSyncExternalStore`-compatible store observing root class changes.
 */
export type CompatThemeName = 'light' | 'dark'

const subscribers = new Set<() => void>()
let observer: MutationObserver | undefined

export function subscribeToRootTheme(onChange: () => void): () => void {
  subscribers.add(onChange)
  if (observer === undefined && typeof document !== 'undefined') {
    observer = new MutationObserver(() => {
      for (const notify of subscribers) {
        notify()
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  }
  return () => {
    subscribers.delete(onChange)
    if (subscribers.size === 0) {
      observer?.disconnect()
      observer = undefined
    }
  }
}

export function getRootThemeSnapshot(): CompatThemeName {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function getServerThemeSnapshot(): CompatThemeName {
  return 'light'
}
