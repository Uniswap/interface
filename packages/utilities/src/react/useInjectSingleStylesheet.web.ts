import { useInsertionEffect } from 'react'
import type { InjectSingleStylesheetParams } from 'utilities/src/react/useInjectSingleStylesheet'

/**
 * Injects a stylesheet into document.head once per id. Safe to call from many component instances.
 */
export function useInjectSingleStylesheet({ id, css, active = true }: InjectSingleStylesheetParams): void {
  useInsertionEffect(() => {
    if (!active || typeof document === 'undefined') {
      return
    }
    // id is the cache key; css is assumed stable — a changed css value under the same id is not applied.
    if (document.getElementById(id)) {
      return
    }
    const style = document.createElement('style')
    style.id = id
    style.textContent = css
    document.head.appendChild(style)
  }, [active, css, id])
}
