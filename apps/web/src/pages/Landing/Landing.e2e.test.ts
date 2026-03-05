import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { setPersistedUserState } from '~/playwright/utils/reduxState'

const test = getTest()
const MOBILE_VIEWPORT = { width: 375, height: 667 }
const UNCONNECTED_USER_PARAM = '?eagerlyConnect=false' // Query param to prevent automatic wallet connection
const FORCE_INTRO_PARAM = '?intro=true' // Query param to force the intro screen to be displayed

test.describe(
  'Landing Page',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
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
      test('renders UK compliance banner in UK', async ({ page }) => {
        await setPersistedUserState(page, { originCountry: 'GB' })

        await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
        await page.getByText('Read more').click()
        await expect(page.getByText('Disclaimer for UK residents')).toBeVisible()
      })

      test('does not render UK compliance banner in US', async ({ page }) => {
        await page.goto(`/swap${UNCONNECTED_USER_PARAM}`)
        await expect(page.getByTestId(TestID.UKDisclaimer)).not.toBeVisible()
      })
    })
  },
)
