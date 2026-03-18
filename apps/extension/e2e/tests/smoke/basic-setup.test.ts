import { expect } from '@playwright/test'
import { freshExtensionTest as test } from 'e2e/fixtures/extension.fixture'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { sleep } from 'utilities/src/time/timing'

test.describe('Basic Extension Setup', () => {
  test('extension loads successfully', async ({ context, extensionId }) => {
    // Verify extension ID was captured
    expect(extensionId).toBeTruthy()
    expect(extensionId).toMatch(/^[a-z]{32}$/)

    // Wait for extension pages to appear with retry logic
    let extensionPages = []
    const maxAttempts = 20
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(ONE_SECOND_MS)
      const pages = context.pages()
      extensionPages = pages.filter((page) => page.url().includes(`chrome-extension://${extensionId}`))
      if (extensionPages.length > 0) {
        break
      }
    }

    // Check that we have at least one page open
    const pages = context.pages()
    expect(pages.length).toBeGreaterThan(0)

    // Verify at least one page is from the extension
    expect(extensionPages.length).toBeGreaterThan(0)
  })

  test('background script loads', async ({ context }) => {
    // Wait for background script/service worker to load
    await sleep(ONE_SECOND_MS * 2)

    // Check for background pages or service workers
    const backgroundPages = context.backgroundPages()
    const serviceWorkers = context.serviceWorkers()

    // Either background pages or service workers should exist
    const hasBackground = backgroundPages.length > 0 || serviceWorkers.length > 0
    expect(hasBackground).toBeTruthy()
  })
})
