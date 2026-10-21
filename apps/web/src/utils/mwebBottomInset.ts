import { isWebAndroid } from '@universe/environment'
import { IN_APP_BROWSER_CHROME_PX } from '~/constants/inAppBrowser'
import { isInAppBrowser } from '~/utils/isInAppBrowser'

/** Declared in global.css; the fallback covers shared packages rendered outside apps/web. */
export const MWEB_BOTTOM_INSET = 'var(--mweb-bottom-inset, 0px)' as const

export function applyMwebBottomInset(): void {
  if (!isWebAndroid || !isInAppBrowser()) {
    return
  }
  document.documentElement.style.setProperty(
    '--mweb-bottom-inset',
    `calc(env(safe-area-inset-bottom, 0px) + ${IN_APP_BROWSER_CHROME_PX}px)`,
  )
}
