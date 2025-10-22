import { expect } from '@playwright/test'
import { freshExtensionTest as test } from 'e2e/fixtures/extension.fixture'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

test.describe('Extension Onboarding Flow', () => {
  test('onboarding tab opens automatically on fresh install', async ({ context }) => {
    // Wait for onboarding tab to open automatically
    const onboardingPage = await context.waitForEvent('page', {
      predicate: (page) => page.url().includes('onboarding.html'),
      timeout: ONE_SECOND_MS * 10,
    })

    // Verify onboarding page loaded
    expect(onboardingPage).toBeTruthy()
    await onboardingPage.waitForLoadState('networkidle')

    // Check that the onboarding page is loaded
    // Look for onboarding-specific elements
    await onboardingPage.waitForSelector('[data-testid="onboarding-intro"], button, input', { timeout: 5000 })

    // Verify we're on the onboarding page
    const title = await onboardingPage.title()
    expect(title).toContain('Uniswap Extension')
  })

  test.skip('sidebar is disabled before onboarding completion', async () => {
    // This test requires clicking the actual extension button in Chrome's toolbar,
    // which is not easily accessible via Playwright. The expected behavior is that
    // clicking the extension button opens onboarding instead of the sidebar when
    // the extension is not yet onboarded.
    // Direct navigation to sidepanel.html doesn't trigger the redirect logic
    // that happens when using the extension button.
  })

  test('background script initializes on fresh install', async ({ context }) => {
    // Wait for any extension page to load
    await context.waitForEvent('page', {
      predicate: (page) => page.url().includes('chrome-extension://'),
      timeout: 5000,
    })

    // Check for service workers or background pages
    const backgroundPages = context.backgroundPages()
    const serviceWorkers = context.serviceWorkers()

    // Either background pages or service workers should exist
    const hasBackground = backgroundPages.length > 0 || serviceWorkers.length > 0
    expect(hasBackground).toBe(true)

    if (serviceWorkers.length > 0) {
      // For service workers, we can't evaluate directly
    } else if (backgroundPages.length > 0) {
      // Verify background script is running
      const background = backgroundPages[0]
      const hasBackgroundStore = await background?.evaluate(() => {
        return 'backgroundStore' in window
      })
      expect(hasBackgroundStore).toBe(true)
    }
  })
})
