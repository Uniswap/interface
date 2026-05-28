/**
 * Common mocks for `@universe/environment`. Intended to be imported from a consumer
 * package's `vitest-setup.ts` so its tests get sensible web defaults for platform
 * booleans without losing the rest of the package's exports (env helpers,
 * REQUEST_SOURCE, chrome helpers, etc.).
 *
 * Notes:
 * * Uses `importOriginal` so missing exports fall through to real values.
 * * Mocks can be overridden in individual test files via `vi.mock(...)`.
 */

import { vi } from 'vitest'

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    isAndroid: false,
    isIOS: false,
    isWebPlatform: true,
    isMobileWeb: false,
    isWebIOS: false,
    isWebAndroid: false,
    isTouchable: false,
    isHoverable: true,
    isChrome: true,
    isSafari: false,
    isMobileWebSafari: false,
    isMobileWebAndroid: false,
    isExtensionApp: false,
    isMobileApp: false,
    isWebApp: true,
    isWebAppDesktop: true,
  }
})
