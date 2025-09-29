import { expect, getTest } from 'playwright/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()
const MOBILE_VIEWPORT = { width: 375, height: 667 }
const UNCONNECTED_USER_PARAM = '?eagerlyConnect=false' // Query param to prevent automatic wallet connection
const FORCE_INTRO_PARAM = '?intro=true' // Query param to force the intro screen to be displayed

test.describe('Landing Page', () => {
  test('shows landing page when no user state exists', async ({ page }) => {
    await page.goto(`/${UNCONNECTED_USER_PARAM}`)
    await expect(page.getByTestId(TestID.LandingPage)).toBeVisible()
  })

  test('shows landing page when intro is forced', async ({ page }) => {
    await page.goto(`/${FORCE_INTRO_PARAM}`)
    await expect(page.getByTestId(TestID.LandingPage)).toBeVisible()
  })

  test('allows navigation to pool', async ({ page }) => {
    await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
    await page.getByRole('link', { name: 'Pool' }).click()
    await expect(page).toHaveURL('/positions')
  })

  test('allows navigation to pool on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT)
    await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
    await page.getByTestId(TestID.NavCompanyMenu).click()
    await expect(page.getByTestId(TestID.CompanyMenuMobileDrawer)).toBeVisible()
    await page.getByRole('link', { name: 'Pool' }).click()
    await expect(page).toHaveURL('/positions')
  })

  test('does not render landing page when / path is blocked', async ({ page }) => {
    await page.route('/', async (route) => {
      const response = await route.fetch()
      const body = (await response.text()).replace(
        '</head>',
        `<meta property="x:blocked-paths" content="/,/buy"></head>`,
      )
      await route.fulfill({ status: response.status(), headers: response.headers(), body })
    })

    await page.goto('/')
    await expect(page.getByTestId(TestID.LandingPage)).not.toBeVisible()
    await expect(page.getByTestId(TestID.BuyFiatButton)).not.toBeVisible()
    await expect(page).toHaveURL('/swap')
  })

  test.describe('UK compliance banner', () => {
    test.afterEach(async ({ page }) => {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    })
    test('renders UK compliance banner in UK', async ({ page }) => {
      await page.route(/(?:interface|beta)\.gateway\.uniswap\.org\/v1\/amplitude-proxy/, async (route) => {
        const requestBody = JSON.stringify(await route.request().postDataJSON())
        const originalResponse = await route.fetch()
        const byteSize = new Blob([requestBody]).size
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { ...originalResponse.headers(), 'origin-country': 'GB' },
          body: JSON.stringify({
            code: 200,
            server_upload_time: Date.now(),
            payload_size_bytes: byteSize,
            events_ingested: (await route.request().postDataJSON()).events.length,
          }),
        })
      })

      await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
      await page.getByText('Read more').click()
      await expect(page.getByText('Disclaimer for UK residents')).toBeVisible()
    })

    test('does not render UK compliance banner in US', async ({ page }) => {
      await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
      await expect(page.getByTestId(TestID.UKDisclaimer)).not.toBeVisible()
    })
  })
})
