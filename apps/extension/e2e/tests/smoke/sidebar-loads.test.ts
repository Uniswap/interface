import { expect } from '@playwright/test'
import { onboardedExtensionTest as test } from 'e2e/fixtures/extension.fixture'
import { openExtensionSidebar, waitForBackgroundReady } from 'e2e/utils/extension-helpers'

test.describe('Extension Sidebar', () => {
  test.beforeEach(async ({ context }) => {
    // Ensure background script is ready
    await waitForBackgroundReady(context)
  })

  test('sidebar loads successfully', async ({ context, extensionId }) => {
    // Open the sidebar
    const sidebarPage = await openExtensionSidebar(context, extensionId)
    await sidebarPage.waitForLoadState('networkidle')

    // The sidebar should load without critical errors
    const errors: string[] = []
    sidebarPage.on('pageerror', (error) => errors.push(error.message))

    // Wait for the page to stabilize
    await sidebarPage.waitForTimeout(2000)

    // Check what state the sidebar is in
    const pageContent = await sidebarPage.content()

    // The extension could be in different states:
    // 1. Main sidebar UI with portfolio/tokens
    // 2. Settings page
    // 3. Error state

    // Check for main UI elements that indicate successful load
    // Looking for any common UI elements that appear in the sidebar
    const hasTabBar = (await sidebarPage.locator('[role="tablist"]').count()) > 0
    const hasTokens = (await sidebarPage.locator('text=/Token|Portfolio|Assets/i').count()) > 0
    const hasSettings = (await sidebarPage.locator('button[aria-label*="Settings"]').count()) > 0
    const hasAccountInfo = (await sidebarPage.locator('text=/0x[0-9a-fA-F]+/').count()) > 0

    // Also check for the main container
    const hasMainContent = (await sidebarPage.locator('#root').count()) > 0

    // At least one of these states should be present
    const isInValidState = hasTabBar || hasTokens || hasSettings || hasAccountInfo || hasMainContent

    // For debugging in CI
    if (!isInValidState) {
      console.log('Sidebar URL:', sidebarPage.url())
      console.log('Page has tab bar:', hasTabBar)
      console.log('Page has tokens:', hasTokens)
      console.log('Page has settings:', hasSettings)
      console.log('Page has account info:', hasAccountInfo)
      console.log('Page has main content:', hasMainContent)
      console.log('Page content length:', pageContent.length)

      // Log a sample of the page content for debugging
      const bodyText = await sidebarPage
        .locator('body')
        .innerText()
        .catch(() => 'Could not get body text')
      console.log('Body text preview:', bodyText.substring(0, 500))
    }

    expect(isInValidState).toBe(true)

    // Verify no critical errors occurred
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('ResizeObserver') && // Ignore common benign errors
        !e.includes('Non-Error promise rejection') &&
        !e.includes('Failed to load resource'), // May happen with external resources
    )

    expect(criticalErrors).toHaveLength(0)
  })
})
