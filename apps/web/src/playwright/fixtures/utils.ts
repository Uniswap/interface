import type { Page } from '~/playwright/fixtures'

/**
 * Gets an element by test ID, excluding elements inside [data-testid-ignore].
 * AdaptiveDropdown renders children twice (once hidden for measurement), so we filter out the hidden copy.
 */
export function getVisibleDropdownElementByTestId(page: Page, testId: string) {
  return page.locator(`[data-testid="${testId}"]:not([data-testid-ignore] *):not([data-testid-ignore])`)
}
