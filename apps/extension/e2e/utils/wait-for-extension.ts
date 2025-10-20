/** biome-ignore-all lint/suspicious/noExplicitAny: e2e test file */
import type { BrowserContext } from '@playwright/test'
import { sleep } from 'utilities/src/time/timing'

export async function waitForExtensionLoad(
  context: BrowserContext,
  options?: {
    timeout?: number
    waitForOnboarding?: boolean
  },
): Promise<{ extensionId: string; onboardingPage?: any }> {
  const timeout = options?.timeout ?? 30000
  const startTime = Date.now()

  let extensionId: string | undefined
  let onboardingPage: any

  while (Date.now() - startTime < timeout) {
    // Check all pages
    const pages = context.pages()
    for (const page of pages) {
      const url = page.url()
      if (url.startsWith('chrome-extension://')) {
        extensionId = url.split('/')[2]
        if (url.includes('onboarding')) {
          onboardingPage = page
        }
        break
      }
    }

    // Check background pages
    if (!extensionId) {
      const backgroundPages = context.backgroundPages()
      for (const page of backgroundPages) {
        const url = page.url()
        if (url.startsWith('chrome-extension://')) {
          extensionId = url.split('/')[2]
          break
        }
      }
    }

    // Check service workers
    if (!extensionId) {
      const workers = context.serviceWorkers()
      for (const worker of workers) {
        const url = worker.url()
        if (url.startsWith('chrome-extension://')) {
          extensionId = url.split('/')[2]
          break
        }
      }
    }

    // If we found the extension and we're waiting for onboarding, keep checking
    if (extensionId && options?.waitForOnboarding && !onboardingPage) {
      // Continue waiting for onboarding page
    } else if (extensionId) {
      // We have what we need
      break
    }

    await sleep(100)
  }

  if (!extensionId) {
    throw new Error(`Extension failed to load within ${timeout}ms`)
  }

  return { extensionId, onboardingPage }
}
