/**
 * Web leg of the Unitag badge image: a decorative <img> that follows the root
 * `dark` class. Lives under `internal/` for the reason given in
 * `close-icon-frame.web.tsx`.
 */
import { useSyncExternalStore } from 'react'
import type { ReactElement } from 'react'
import { UNITAG_DARK_SMALL, UNITAG_LIGHT_SMALL } from '../../../assets'

// Theme source of truth on the web is the `dark` class on the root element
// (see @universe/tailwind base.css `@custom-variant dark`).
function subscribeToRootClass(onChange: () => void): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

function getIsDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

function getIsDarkModeServer(): boolean {
  return false
}

export function UnitagImage({ size }: { size: number | string }): ReactElement {
  const isDarkMode = useSyncExternalStore(subscribeToRootClass, getIsDarkMode, getIsDarkModeServer)

  return (
    <img
      src={isDarkMode ? UNITAG_DARK_SMALL : UNITAG_LIGHT_SMALL}
      alt=""
      width={size}
      height={size}
      style={{ verticalAlign: 'sub' }}
    />
  )
}
