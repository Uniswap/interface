import { TestID } from '@universe/test'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { IN_APP_BROWSER_CHROME_PX } from '~/constants/inAppBrowser'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

const companyMenu = [
  {
    label: 'Products',
    items: [
      { label: 'Wallet', href: 'https://wallet.uniswap.org/' },
      { label: 'UniswapX', href: 'https://x.uniswap.org/' },
      { label: 'API', href: UniswapStaticUrls.tradingApiDocsUrl },
      { label: 'Unichain', href: 'https://www.unichain.org/' },
    ],
  },
  {
    label: 'Protocol',
    items: [
      { label: 'Governance', href: 'https://uniswap.org/governance' },
      { label: 'Developers', href: 'https://uniswap.org/developers' },
      { label: 'Vote', href: 'https://vote.uniswapfoundation.org' },
    ],
  },
  {
    label: 'Company',
    items: [
      { label: 'Careers', href: 'https://careers.uniswap.org/' },
      { label: 'Blog', href: 'https://blog.uniswap.org/' },
    ],
  },
]

const tabs = [
  {
    label: 'Trade',
    path: '/swap',
    dropdown: [
      { label: 'Swap', path: '/swap' },
      { label: 'Limit', path: '/limit' },
      { label: 'Buy', path: '/buy' },
    ],
  },
  {
    label: 'Explore',
    path: '/explore',
    dropdown: [
      { label: 'Tokens', path: '/explore/tokens' },
      { label: 'Pools', path: '/explore/pools' },
      { label: 'Transactions', path: '/explore/transactions' },
    ],
  },
  {
    label: 'Pool',
    path: '/positions',
    dropdown: [
      { label: 'View position', path: '/positions' },
      { label: 'Create position', path: '/positions/add' },
    ],
  },
]
const socialMediaLinks = ['https://github.com/Uniswap', 'https://x.com/Uniswap', 'https://discord.com/invite/uniswap']

// Trust Wallet's Android in-app browser; `; wv)` is the token `isInAppBrowser()` keys on.
const IN_APP_BROWSER_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36'

test.describe(
  'NavBar',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('Desktop navigation', () => {
      test('clicking nav icon redirects to home page', async ({ page }) => {
        await page.goto('/swap')
        await page.getByTestId(TestID.NavUniswapLogo).click()
        await expect(page).toHaveURL(/\/\?intro=true/)
      })

      test('Company menu displays complete sections, links, and legal content', async ({ page }) => {
        await page.goto('/')
        await page.getByTestId(TestID.NavCompanyMenu).hover()
        const dropdown = page.getByTestId(TestID.NavCompanyDropdown).first()
        await expect(dropdown).toBeVisible()

        // Verify all menu sections and their links
        for (const section of companyMenu) {
          await expect(
            page.getByTestId(TestID.NavCompanyDropdown).getByTestId(`menu-section-${section.label}`),
          ).toBeVisible()
          for (const item of section.items) {
            await expect(
              page.getByTestId(TestID.NavCompanyDropdown).locator(`a:has-text("${item.label}")`),
            ).toHaveAttribute('href', item.href)
          }
        }

        // Verify social media links
        for (const link of socialMediaLinks) {
          await expect(page.getByTestId(TestID.NavCompanyDropdown).locator(`a[href='${link}']`)).toBeVisible()
        }

        // Verify Legal & Privacy section
        await expect(dropdown.getByText('Legal & Privacy')).toBeVisible()
        await dropdown.getByText('Legal & Privacy').click()

        await expect(page.getByTestId(TestID.NavCompanyDropdown).getByText('Your Privacy Choices')).toBeVisible()
        await expect(page.getByTestId(TestID.NavCompanyDropdown).getByText('Privacy Policy')).toBeVisible()
        await expect(page.getByTestId(TestID.NavCompanyDropdown).getByText('Terms of Service')).toBeVisible()

        await expect(
          page.getByTestId(TestID.NavCompanyDropdown).locator(`a[href="${UniswapStaticUrls.termsOfServiceUrl}"]`),
        ).toBeVisible()
      })

      for (const tab of tabs) {
        test(`displays "${tab.label}" tab and navigates`, async ({ page }) => {
          await page.goto('/')
          await page.getByTestId(`${tab.label}-tab`).locator('a').click()
          await expect(page).toHaveURL(tab.path)
        })
      }
    })

    test.describe('Mobile navigation', () => {
      test.beforeEach(async ({ page }) => {
        // Set a mobile viewport
        await page.setViewportSize({ width: 449, height: 900 })
        await page.goto('/')
        await page.waitForTimeout(500)
        await page.getByTestId(TestID.NavCompanyMenu).click()
      })

      for (const tab of tabs) {
        test(`displays "${tab.label}" tab and navigates`, async ({ page }) => {
          const drawer = page.getByTestId(TestID.CompanyMenuMobileDrawer)
          await drawer.getByRole('link', { name: tab.label }).click()
          await expect(page).toHaveURL(tab.path)
        })
      }

      test('displays complete mobile drawer with all sections, social media, and legal content', async ({ page }) => {
        const drawer = page.getByTestId(TestID.CompanyMenuMobileDrawer)
        await expect(drawer).toBeVisible()

        // Verify all menu sections and their links
        for (const section of companyMenu) {
          // Expand the section (Products, Protocol, and Company are all collapsible accordions)
          await drawer.getByText(section.label).click()
          for (const item of section.items) {
            await expect(drawer.locator(`a:has-text("${item.label}")`)).toHaveAttribute('href', item.href)
          }
        }

        // Verify social media links
        for (const link of socialMediaLinks) {
          await expect(page.getByTestId(TestID.CompanyMenuMobileDrawer).locator(`a[href='${link}']`)).toBeVisible()
        }

        // Verify Legal & Privacy section
        await expect(drawer.getByText('Legal & Privacy')).toBeVisible()
        await drawer.getByText('Legal & Privacy').click()

        await expect(drawer.getByText('Your Privacy Choices')).toBeVisible()
        await expect(drawer.getByText('Privacy Policy')).toBeVisible()
        await expect(drawer.getByText('Terms of Service')).toBeVisible()

        await expect(drawer.locator(`a[href="${UniswapStaticUrls.termsOfServiceUrl}"]`)).toBeVisible()
      })

      test.describe('in-app browser bottom chrome', () => {
        test.use({ userAgent: IN_APP_BROWSER_USER_AGENT })

        test('reserves scrollable clearance below the last row with Company expanded', async ({ page }) => {
          const drawer = page.getByTestId(TestID.CompanyMenuMobileDrawer)
          await expect(drawer).toBeVisible()

          // Company is the last collapsible section, so expanding it pushes the footer rows furthest down.
          const companyItems = companyMenu.find((section) => section.label === 'Company')?.items ?? []
          expect(companyItems.length).toBeGreaterThan(0)
          await drawer.getByText('Company').click()
          for (const item of companyItems) {
            await expect(drawer.locator(`a:has-text("${item.label}")`)).toHaveAttribute('href', item.href)
          }
          // The accordion animates open; measure settled geometry.
          await page.waitForTimeout(300)

          const pane = await drawer.evaluate((el) => {
            // A collapsed accordion section (e.g. "Legal & Privacy", which this test never
            // expands) sets `height: 0` + `overflow: hidden` on its HeightAnimator wrapper but
            // keeps its children mounted — and a zero-height ancestor does not compress its
            // children's own layout box, so `getBoundingClientRect()` on those children still
            // reports the position they'd occupy if expanded. Left unfiltered, the querySelector
            // below picks up those phantom rows and can report one of them as "the last row",
            // even though it renders nowhere near the visible pane — undercounting the real
            // clearance by however tall the collapsed section would be. Skip any row sitting
            // under a zero-size ancestor.
            const isRowRendered = (row: Element): boolean => {
              for (let node: Element | null = row; node && node !== el; node = node.parentElement) {
                const rect = node.getBoundingClientRect()
                if (rect.height === 0 || rect.width === 0) {
                  return false
                }
              }
              return true
            }
            const rows = Array.from(el.querySelectorAll('a, button, [role="button"]')).filter(isRowRendered)
            // Pane-content coordinates: viewport y - pane top + current scroll offset.
            const contentTop = el.getBoundingClientRect().top - el.scrollTop
            const lastRowBottom = Math.max(...rows.map((row) => row.getBoundingClientRect().bottom - contentTop))
            return {
              overflowY: window.getComputedStyle(el).overflowY,
              rowCount: rows.length,
              clearanceBelowLastRow: el.scrollHeight - lastRowBottom,
            }
          })

          expect(pane.rowCount).toBeGreaterThan(0)
          expect(pane.overflowY).toBe('auto')
          // Lower bound, not equality: the drawer's own bottom padding adds to the shared allowance.
          expect(pane.clearanceBelowLastRow).toBeGreaterThanOrEqual(IN_APP_BROWSER_CHROME_PX)
          // Upper bound so `isRowRendered` over-excluding rows (e.g. a real, visible row that
          // happens to sit under a zero-size ancestor for some unrelated reason) can't inflate
          // `lastRowBottom`'s absence into a vacuous pass.
          expect(pane.clearanceBelowLastRow).toBeLessThan(IN_APP_BROWSER_CHROME_PX * 2)

          // Headless Chromium draws no overlay chrome, so this asserts only that the footer rows are
          // reachable at the end of the pane; the real band needs device QA.
          await drawer.evaluate((el) => el.scrollTo({ top: el.scrollHeight }))
          for (const link of socialMediaLinks) {
            await expect(drawer.locator(`a[href='${link}']`)).toBeInViewport()
          }
          await expect(drawer.getByText('Legal & Privacy')).toBeInViewport()
        })
      })

      test('displays mobile-specific UI elements', async ({ page }) => {
        // Verify help modal from mobile drawer
        await page.getByTestId(TestID.CompanyMenuMobileDrawer).getByTestId(TestID.HelpIcon).click()
        await expect(page.getByTestId(TestID.HelpModal)).toBeVisible()

        await expect(page.getByTestId(TestID.HelpModal).getByText('Get help')).toBeVisible()
        await expect(page.getByTestId(TestID.HelpModal).getByText('Docs')).toBeVisible()
        await expect(page.getByTestId(TestID.HelpModal).getByText('Contact us')).toBeVisible()

        await expect(
          page.getByTestId(TestID.HelpModal).locator('a[href="https://support.uniswap.org/hc/en-us"]'),
        ).toBeVisible()
        await expect(page.getByTestId(TestID.HelpModal).locator('a[href="https://docs.uniswap.org/"]')).toBeVisible()
        await expect(
          page.getByTestId(TestID.HelpModal).locator('a[href="https://support.uniswap.org/hc/en-us/requests/new"]'),
        ).toBeVisible()
      })

      test('displays bottom bar on token details page', async ({ page }) => {
        await page.goto('/explore/tokens/ethereum/NATIVE')
        const bottomBar = page.getByTestId(TestID.TokenDetailsMobileBottomBar)
        await expect(bottomBar).toBeVisible()
        await expect(bottomBar.getByText('Buy')).toBeVisible()
        // "Sell" only appears when the connected wallet has a token balance
      })
    })
  },
)
