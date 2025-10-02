import type { BrowserContext, Page } from '@playwright/test'
import { sleep } from 'utilities/src/time/timing'

export async function openExtensionSidebar(context: BrowserContext, extensionId: string): Promise<Page> {
  const sidebarUrl = `chrome-extension://${extensionId}/sidepanel.html`
  const page = await context.newPage()
  await page.goto(sidebarUrl)
  return page
}

export async function waitForBackgroundReady(context: BrowserContext): Promise<void> {
  const maxAttempts = 30
  let attempts = 0

  while (attempts < maxAttempts) {
    // Check for background pages first
    const backgroundPages = context.backgroundPages()
    if (backgroundPages.length > 0) {
      const background = backgroundPages[0]
      const isReady = await background
        ?.evaluate(() => {
          // Check if the background store is initialized
          return typeof window !== 'undefined' && 'backgroundStore' in window
        })
        .catch(() => false)

      if (isReady) {
        return
      }
    }

    // Also check for service workers (modern extensions use these)
    const serviceWorkers = context.serviceWorkers()
    if (serviceWorkers.length > 0) {
      // Service workers are ready if they exist
      // We can't evaluate inside them like background pages
      return
    }

    await sleep(100)
    attempts++
  }

  throw new Error('Background script failed to initialize within timeout')
}
