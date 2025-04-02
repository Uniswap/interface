import { expect, test } from 'playwright/fixtures'
import { gotoAndWait } from 'playwright/utils'

const MOBILE_VIEWPORT = { width: 375, height: 667 }
const UNCONNECTED_USER_PARAM = '?eagerlyConnect=false' // Query param to prevent automatic wallet connection
const FORCE_INTRO_PARAM = '?intro=true' // Query param to force the intro screen to be displayed

test.describe('Landing Page', () => {
  test('shows landing page when no user state exists', async ({ page }) => {
    await gotoAndWait(page, `/${UNCONNECTED_USER_PARAM}`)
    await expect(page.getByTestId('landing-page')).toBeVisible()
    await page.screenshot({ path: 'landing-page.png' })
  })

  test('shows landing page when intro is forced', async ({ page }) => {
    await gotoAndWait(page, `/${FORCE_INTRO_PARAM}`)
    await expect(page.getByTestId('landing-page')).toBeVisible()
  })

  test('shows "Sign up" CTA on the landing page in an unconnected state', async ({ page }) => {
    await gotoAndWait(page, `/${UNCONNECTED_USER_PARAM}`)
    await expect(page.getByText('Sign up')).toBeVisible()

    await gotoAndWait(page, `/swap?${UNCONNECTED_USER_PARAM}`)
    await expect(page.getByText('Sign up')).not.toBeVisible()
  })

  test('hides "Sign up" CTA on small screens', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT)
    await gotoAndWait(page, `/${UNCONNECTED_USER_PARAM}`)
    await expect(page.getByTestId('nav-sign-up')).not.toBeVisible()
  })

  test('opens modal when the "Sign up" button is clicked', async ({ page }) => {
    await gotoAndWait(page, `/${UNCONNECTED_USER_PARAM}`)
    await page.act({ action: 'Click "Sign up" in nav' })
    await expect(page.getByText('Sign up with Uniswap')).toBeVisible()
  })

  test('allows navigation to pool', async ({ page }) => {
    await gotoAndWait(page, `/swap?${UNCONNECTED_USER_PARAM}`)
    await page.act({ action: 'Click "Pool" tab' })
    await expect(page).toHaveURL('/positions')
  })

  test('allows navigation to pool on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT)
    await gotoAndWait(page, `/swap?${UNCONNECTED_USER_PARAM}`)
    await page.getByTestId('nav-company-menu').click()
    await expect(page.getByTestId('company-menu-mobile-drawer')).toBeVisible()
    await page.act({ action: 'Click the "Pool" option in the mobile drawer' })
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

    await gotoAndWait(page, '/')
    await expect(page.getByTestId('landing-page')).not.toBeVisible()
    await expect(page.getByTestId('buy-fiat-button')).not.toBeVisible()
    await expect(page).toHaveURL('/swap')
  })

  test('renders UK compliance banner in UK', async ({ page }) => {
    await page.route(/(?:interface|beta).gateway.uniswap.org\/v1\/amplitude-proxy/, async (route) => {
      const requestBody = JSON.stringify(await route.request().postDataJSON())
      const byteSize = new Blob([requestBody]).size
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'origin-country': 'GB' },
        body: JSON.stringify({
          code: 200,
          server_upload_time: Date.now(),
          payload_size_bytes: byteSize,
          events_ingested: (await route.request().postDataJSON()).events.length,
        }),
      })
    })

    await gotoAndWait(page, `/swap?${UNCONNECTED_USER_PARAM}`)
    await page.act({ action: 'Click "Read more"' })
    await expect(page.getByText('Disclaimer for UK residents')).toBeVisible()
  })

  test('does not render UK compliance banner in US', async ({ page }) => {
    await gotoAndWait(page, `/swap?${UNCONNECTED_USER_PARAM}`)
    await expect(page.getByTestId('uk-disclaimer')).not.toBeVisible()
  })
})
