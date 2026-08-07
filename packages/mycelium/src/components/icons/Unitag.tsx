import { memo, useSyncExternalStore } from 'react'
import type { ReactElement } from 'react'
import UNITAG_DARK_SMALL from './assets/unitag-dark-small.png'
import UNITAG_LIGHT_SMALL from './assets/unitag-light-small.png'

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

function UnitagIcon({ size = 24 }: { size?: number | string }): ReactElement {
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

export const Unitag = memo(UnitagIcon)
