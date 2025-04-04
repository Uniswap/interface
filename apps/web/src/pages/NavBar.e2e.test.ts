import { expect, test } from 'playwright/fixtures'

const companyMenu = [
  {
    label: 'Company',
    items: [
      { label: 'Careers', href: 'https://careers.uniswap.org/' },
      { label: 'Blog', href: 'https://blog.uniswap.org/' },
    ],
  },
  {
    label: 'Protocol',
    items: [
      { label: 'Governance', href: 'https://uniswap.org/governance' },
      { label: 'Developers', href: 'https://uniswap.org/developers' },
    ],
  },
  {
    label: 'Need help?',
    items: [
      { label: 'Help center', href: 'https://support.uniswap.org/hc/en-us' },
      { label: 'Contact us', href: 'https://support.uniswap.org/hc/en-us/requests/new' },
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
      { label: 'Send', path: '/send' },
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
      { label: 'Create position', path: '/positions/create' },
    ],
  },
]
// locator('div').first()
const socialMediaLinks = ['https://github.com/Uniswap', 'https://x.com/Uniswap', 'https://discord.com/invite/uniswap']

test.describe('Navigation', () => {
  test('clicking nav icon redirects to home page', async ({ page }) => {
    await page.goto('/swap')
    await page.getByTestId('nav-uniswap-logo').click()
    await expect(page).toHaveURL(/\/\?intro=true/)
  })

  test.describe('Company menu', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })
    test('contains appropriate sections and links', async ({ page }) => {
      await page.getByTestId('nav-company-menu').hover()
      await expect(page.getByTestId('nav-company-dropdown').first()).toBeVisible()

      for (const section of companyMenu) {
        await expect(page.getByTestId('nav-company-dropdown').getByText(section.label)).toBeVisible()
        for (const item of section.items) {
          await expect(page.getByTestId('nav-company-dropdown').locator(`a:has-text("${item.label}")`)).toHaveAttribute(
            'href',
            item.href,
          )
        }
      }
    })

    test('Download Uniswap opens the app modal', async ({ page }) => {
      await page.getByTestId('nav-company-menu').hover()
      const downloadBtn = page.getByTestId('nav-dropdown-download-app')
      await expect(downloadBtn).toBeVisible()
      await downloadBtn.click()
      await expect(page.getByTestId('download-uniswap-modal')).toBeVisible()
    })

    test('includes social media links', async ({ page }) => {
      await page.getByTestId('nav-company-menu').hover()
      for (const link of socialMediaLinks) {
        await expect(page.getByTestId('nav-company-dropdown').locator(`a[href='${link}']`)).toBeVisible()
      }
    })
  })

  for (const tab of tabs) {
    test.describe(`${tab.label} tab`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/')
      })
      test(`displays "${tab.label}" tab and navigates`, async ({ page }) => {
        await page.getByTestId(`${tab.label}-tab`).locator('a').click()
        await expect(page).toHaveURL(tab.path)
      })

      test('expands tab with appropriate dropdown links', async ({ page }) => {
        await page.getByTestId(`${tab.label}-tab`).locator('a').hover()
        await expect(page.getByTestId(`${tab.label}-menu`).first()).toBeVisible()

        for (const item of tab.dropdown) {
          await page.getByTestId(`${tab.label}-tab`).locator('a').hover()
          await page.getByRole('link', { name: item.label }).click()
          await expect(page).toHaveURL(item.path)
        }
      })
    })
  }
})

test.describe('Mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set a mobile viewport
    await page.setViewportSize({ width: 449, height: 900 })
    await page.goto('/')
    await page.waitForTimeout(500)
    await page.getByTestId('nav-company-menu').click()
  })

  for (const tab of tabs) {
    test.describe(`Mobile ${tab.label} tab`, () => {
      test(`displays "${tab.label}" tab and navigates`, async ({ page }) => {
        const drawer = page.getByTestId('company-menu-mobile-drawer')
        await drawer.getByRole('link', { name: tab.label }).click()
        await expect(page).toHaveURL(tab.path)
      })
    })
  }

  test('display settings are visible in mobile menu', async ({ page }) => {
    const drawer = page.getByTestId('company-menu-mobile-drawer')
    await expect(drawer).toBeVisible()
    await page.getByRole('button', { name: 'Display settings' }).click()

    const settings = ['Language', 'Currency']
    for (const label of settings) {
      await expect(page.getByText(label)).toBeVisible()
    }
  })

  test('contains appropriate sections and links', async ({ page }) => {
    const drawer = page.getByTestId('company-menu-mobile-drawer')
    await expect(drawer).toBeVisible()

    for (const section of companyMenu) {
      // Expand the section
      await drawer.getByText(section.label).click()
      for (const item of section.items) {
        await expect(drawer.locator(`a:has-text("${item.label}")`)).toHaveAttribute('href', item.href)
      }
    }
  })

  test('Download Uniswap is visible', async ({ page }) => {
    await expect(page.getByTestId('nav-dropdown-download-app')).toBeVisible()
  })

  test('includes social media links', async ({ page }) => {
    for (const link of socialMediaLinks) {
      await expect(page.getByTestId('company-menu-mobile-drawer').locator(`a[href='${link}']`)).toBeVisible()
    }
  })
})

test('shows bottom bar on token details page on mobile', async ({ page }) => {
  await page.goto('/explore/tokens/ethereum/NATIVE')
  await page.setViewportSize({ width: 449, height: 900 })
  const bottomBar = page.getByTestId('tdp-mobile-bottom-bar')
  await expect(bottomBar).toBeVisible()
  await expect(bottomBar.getByText('Buy')).toBeVisible()
  await expect(bottomBar.getByText('Sell')).toBeVisible()
  await expect(bottomBar.getByText('Send')).toBeVisible()
})
