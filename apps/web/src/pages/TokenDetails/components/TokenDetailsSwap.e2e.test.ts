import { UNI, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

const UNI_MAINNET = UNI[UniverseChainId.Mainnet]

const INPUT_TOKEN_LABEL = `${TestID.ChooseInputToken}-label`
const OUTPUT_TOKEN_LABEL = `${TestID.ChooseOutputToken}-label`

test.describe(
  'TokenDetailsSwap',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.beforeEach(async ({ page }) => {
      // On mobile widths, we just link back to /swap instead of rendering the swap component.
      await page.setViewportSize({ width: 1200, height: 800 })

      await page.goto(`/explore/tokens/ethereum/${UNI_MAINNET.address}`)

      // Wait for swap components to be rendered and ready
      await page.getByTestId(INPUT_TOKEN_LABEL).waitFor({ state: 'visible' })
      await page.getByTestId(OUTPUT_TOKEN_LABEL).waitFor({ state: 'visible' })
    })

    test('should have the expected output for a tokens detail page', async ({ page }) => {
      await expect(page.getByTestId(INPUT_TOKEN_LABEL)).toContainText('ETH')
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue('')
      await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).toContainText('UNI')
    })

    test('should automatically navigate to the new TDP (erc20)', async ({ page }) => {
      await page.getByTestId(OUTPUT_TOKEN_LABEL).click()
      // oxlint-disable-next-line eslint-js/no-restricted-syntax
      await page.getByTestId('token-option-1-USDT').first().click()

      expect(page.url()).toContain(normalizeAddress(USDT.address, AddressStringFormat.Lowercase))
      expect(page.url()).not.toContain(normalizeAddress(UNI_MAINNET.address, AddressStringFormat.Lowercase))
    })

    test('should navigate to the new TDP with correct tokens selected', async ({ page }) => {
      await page.getByTestId(INPUT_TOKEN_LABEL).click()
      // oxlint-disable-next-line eslint-js/no-restricted-syntax
      await page.getByTestId('token-option-1-USDT').first().click()

      await page.getByTestId(OUTPUT_TOKEN_LABEL).click()
      // necessary to guarantee token option shows up in DOM bc of virtualized token selector list
      // scoped by placeholder: the selector's network filter search shares this test ID
      await page.getByTestId(TestID.ExploreSearchInput).and(page.getByPlaceholder('Search tokens')).fill('WBTC')
      // oxlint-disable-next-line eslint-js/no-restricted-syntax
      await page.getByTestId('token-option-1-WBTC').first().click()

      await expect(page.getByTestId(INPUT_TOKEN_LABEL)).toContainText('USDT')
      await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).toContainText('WBTC')
    })

    test('should not share swap state with the main swap page', async ({ page }) => {
      await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).toContainText('UNI')
      await page.getByTestId(INPUT_TOKEN_LABEL).click()
      // oxlint-disable-next-line eslint-js/no-restricted-syntax
      await page.getByTestId('token-option-1-USDT').first().click()
      await page.goto('/swap')

      // Verify UNI and USDT don't exist on swap page
      await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).not.toContainText('UNI')
      await expect(page.getByTestId(INPUT_TOKEN_LABEL)).not.toContainText('USDT')
    })

    test('inline swap is visible only when TDP mobile bottom bar is hidden', async ({ page }) => {
      await test.step('wide viewport: bottom bar hidden, inline swap visible', async () => {
        await expect(page.getByTestId(TestID.TokenDetailsMobileBottomBar)).toBeHidden()
        await expect(page.getByTestId(TestID.TokenDetailsSwap)).toBeVisible()
        await expect(page.getByTestId(INPUT_TOKEN_LABEL)).toBeVisible()
        await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).toBeVisible()
      })

      await test.step('narrow viewport: bottom bar visible, inline swap hidden', async () => {
        await page.setViewportSize({ width: 900, height: 800 })
        await expect(page.getByTestId(TestID.TokenDetailsMobileBottomBar)).toBeVisible()
        await expect(page.getByTestId(TestID.TokenDetailsSwap)).toBeHidden()
        await expect(page.getByTestId(INPUT_TOKEN_LABEL)).toBeHidden()
        await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).toBeHidden()
      })
    })

    test.describe('swap input', () => {
      test('should handle amount into input', async ({ page }) => {
        await page.getByTestId(INPUT_TOKEN_LABEL).click()
        // oxlint-disable-next-line eslint-js/no-restricted-syntax
        await page.getByTestId('token-option-1-USDT').first().click()

        await page.getByTestId(TestID.AmountInputIn).clear()
        await page.getByTestId(TestID.AmountInputIn).fill('0.001')
        await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue('0.001')

        await page.getByTestId(TestID.AmountInputIn).clear()
        await page.getByTestId(TestID.AmountInputIn).fill('0.0')
        await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue('0.0')

        await page.getByTestId(TestID.AmountInputIn).clear()
        await page.getByTestId(TestID.AmountInputIn).fill('\\')
        await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue('')
      })
    })

    test.describe('swap output', () => {
      test('should handle amount into input', async ({ page }) => {
        await page.getByTestId(TestID.AmountInputOut).clear()
        await page.getByTestId(TestID.AmountInputOut).fill('0.001')
        await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue('0.001')

        await page.getByTestId(TestID.AmountInputOut).clear()
        await page.getByTestId(TestID.AmountInputOut).fill('0.0')
        await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue('0.0')
      })
    })
  },
)
