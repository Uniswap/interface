/* oxlint-disable react-hooks/rules-of-hooks -- Playwright fixtures use `use()` which is not a React hook */
// oxlint-disable-next-line no-restricted-imports -- Playwright fixtures need direct test import
import { test as base } from '@playwright/test'

// Marker prefix for logs we want surfaced in CI. Any browser-console message starting with this
// is forwarded to the test worker's stdout (where node-side E2E logs already land)
const E2E_LOG_PREFIX = 'E2E'

// Auto-fixture that forwards matching browser-console output to the worker's stdout. Without it,
// page-side console.* only reaches the browser console and is invisible in CI. Scoped to the E2E
// prefix so we don't flood CI with unrelated app console noise.
export const test = base.extend<{ forwardBrowserConsole: void }>({
  forwardBrowserConsole: [
    async ({ page }, use) => {
      page.on('console', (msg) => {
        const text = msg.text()
        if (text.startsWith(E2E_LOG_PREFIX)) {
          console.error(text)
        }
      })
      await use()
    },
    { auto: true },
  ],
})
