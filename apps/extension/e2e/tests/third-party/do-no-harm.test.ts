import fs from 'fs'
import path from 'path'
import { expect, type Page } from '@playwright/test'
import { freshExtensionTest as test } from 'e2e/fixtures/extension.fixture'
import { collectCriticalPageErrors } from 'e2e/utils/page-error-helpers'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const FIXTURE_PAGE_PATH = path.join(__dirname, '../../fixtures/pages/third-party-globals.html')

// Served via context.route below. Must be an https URL: production builds only inject
// content scripts into `https://*/*` (localhost/127.0.0.1 are dev-build-only matches),
// and the publish gate runs this spec against production-config artifacts. `.test` is a
// reserved TLD, so this can never hit a real host even if routing breaks.
const FIXTURE_PAGE_URL = 'https://third-party-globals.fixture.test/'

// Stable, low-flake third-party pages. The extension's content scripts run on every
// https page, so any uncaught error on these effectively originates from our injection
// (these pages don't throw on their own).
const REAL_THIRD_PARTY_URLS = ['https://example.com', 'https://www.wikipedia.org']

interface ThirdPartyFixtureReport {
  leakedGlobals: string[]
  lexicalScopeClean: boolean
  tookCommonJsBranch: boolean
  errors: string[]
}

async function assertExtensionInjected(page: Page): Promise<void> {
  // Validity guard: make sure the extension's content scripts actually ran on this
  // page — otherwise a "no errors" result would be vacuous.
  await expect
    .poll(async () => page.evaluate(() => typeof (window as { ethereum?: unknown }).ethereum !== 'undefined'), {
      timeout: ONE_SECOND_MS * 15,
    })
    .toBe(true)
}

test.describe('Do no harm: third-party pages', { tag: '@publish-gate' }, () => {
  // INC-283 regression path: leaked bundler globals from injected scripts broke
  // third-party sites' environment detection.
  test('local fixture page keeps a clean global environment', async ({ context }) => {
    await context.route(FIXTURE_PAGE_URL, async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: fs.readFileSync(FIXTURE_PAGE_PATH, 'utf8'),
      })
    })

    const page = await context.newPage()
    const getCriticalErrors = collectCriticalPageErrors(page)

    await page.goto(FIXTURE_PAGE_URL)
    await expect(page.locator('#status')).toHaveText('fixture-ok')
    await assertExtensionInjected(page)

    const report = (await page.evaluate(
      () => (window as { __thirdPartyFixtureReport?: unknown }).__thirdPartyFixtureReport,
    )) as ThirdPartyFixtureReport

    expect(report.errors).toEqual([])
    expect(report.leakedGlobals).toEqual([])
    // INC-283 / #33221 repro: leaked top-level var/function declarations from a
    // MAIN-world content script make the fixture's top-level `let e, t, r, ...`
    // block throw "Identifier ... has already been declared".
    expect(report.lexicalScopeClean).toBe(true)
    expect(report.tookCommonJsBranch).toBe(false)
    expect(getCriticalErrors()).toEqual([])
  })

  for (const url of REAL_THIRD_PARTY_URLS) {
    test(`${new URL(url).hostname} renders without extension-injected errors`, async ({ context }) => {
      const page = await context.newPage()
      const getCriticalErrors = collectCriticalPageErrors(page)

      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await assertExtensionInjected(page)

      // The page must actually render content.
      await expect(page.locator('body')).toBeVisible()
      expect((await page.title()).length).toBeGreaterThan(0)

      // Give late-executing injected code a moment to surface errors.
      await page.waitForTimeout(ONE_SECOND_MS * 3)

      expect(getCriticalErrors()).toEqual([])
    })
  }
})
