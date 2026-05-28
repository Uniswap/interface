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
    // MV3 extensions use service workers instead of background pages
    const serviceWorkers = context.serviceWorkers()
    if (serviceWorkers.length > 0) {
      return
    }

    await sleep(100)
    attempts++
  }

  throw new Error('Background script failed to initialize within timeout')
}
