import { useIsChromeWindowFocusedWithTimeout } from 'uniswap/src/extension/useIsChromeWindowFocused'
import { isExtensionApp } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export type UsePlatformBasedValue<T> = {
  defaultValue: T
  mobile?: {
    defaultValue?: T
  }
  web?: {
    defaultValue?: T
  }
  extension?: {
    defaultValue?: T
    windowNotFocused?: T
  }
}

export function usePlatformBasedValue<T>({ defaultValue, web, extension }: UsePlatformBasedValue<T>): T {
  // We add a 30s delay before we trigger the `windowNotFocused` state to avoid unnecessary state changes when the user is quickly switching back-and-forth between windows.
  // Without this delay, we could end up triggering too many unnecessary API calls every time the window regains focus.
  const isChromeWindowFocused = useIsChromeWindowFocusedWithTimeout(30 * ONE_SECOND_MS)

  if (isExtensionApp) {
    if (!isChromeWindowFocused) {
      return extension?.windowNotFocused ?? defaultValue
    }

    return extension?.defaultValue ?? defaultValue
  }

  return web?.defaultValue ?? defaultValue
}
