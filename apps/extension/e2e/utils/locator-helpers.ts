import type { Locator } from '@playwright/test'

/**
 * Waits up to `timeoutMs` for the locator to become visible; resolves false instead of
 * throwing when it doesn't. Use for optional UI (screens that only appear in some
 * environments) — `locator.isVisible()` does not wait.
 */
export async function isVisibleWithin(locator: Locator, timeoutMs: number): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout: timeoutMs })
    return true
  } catch {
    return false
  }
}
