/* eslint-disable no-restricted-syntax */
import { expect, getTest } from 'playwright/fixtures'
import { UNI, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'

const test = getTest()

const UNI_MAINNET = UNI[UniverseChainId.Mainnet]

const INPUT_TOKEN_LABEL = `${TestID.ChooseInputToken}-label`
const OUTPUT_TOKEN_LABEL = `${TestID.ChooseOutputToken}-label`

test.describe('TokenDetailsSwap', () => {
  test.beforeEach(async ({ page }) => {
    // On mobile widths, we just link back to /swap instead of rendering the swap component.
    await page.setViewportSize({ width: 1200, height: 800 })

    await page.goto(`/explore/tokens/ethereum/${UNI_MAINNET.address}`)
  })

  test('should have the expected output for a tokens detail page', async ({ page }) => {
    await expect(page.getByTestId(INPUT_TOKEN_LABEL)).toContainText('ETH')
    await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue('')
    await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).toContainText('UNI')
  })

  test('should automatically navigate to the new TDP (erc20)', async ({ page }) => {
    await page.getByTestId(OUTPUT_TOKEN_LABEL).click()
    await page.getByTestId('token-option-1-USDT').first().click()

    await expect(page.url()).toContain(normalizeAddress(USDT.address, AddressStringFormat.Lowercase))
    await expect(page.url()).not.toContain(normalizeAddress(UNI_MAINNET.address, AddressStringFormat.Lowercase))
  })

  test('should navigate to the new TDP with correct tokens selected', async ({ page }) => {
    await page.getByTestId(INPUT_TOKEN_LABEL).click()
    await page.getByTestId('token-option-1-USDT').first().click()

    await page.getByTestId(OUTPUT_TOKEN_LABEL).click()
    await page.getByTestId('token-option-1-WBTC').first().click()

    await expect(page.getByTestId(INPUT_TOKEN_LABEL)).toContainText('USDT')
    await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).toContainText('WBTC')
  })

  test('should not share swap state with the main swap page', async ({ page }) => {
    await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).toContainText('UNI')
    await page.getByTestId(INPUT_TOKEN_LABEL).click()
    await page.getByTestId('token-option-1-USDT').first().click()
    await page.goto('/swap')

    // Verify UNI and USDT don't exist on swap page
    await expect(page.getByTestId(OUTPUT_TOKEN_LABEL)).not.toContainText('UNI')
    await expect(page.getByTestId(INPUT_TOKEN_LABEL)).not.toContainText('USDT')
  })

  test.describe('swap input', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByTestId(INPUT_TOKEN_LABEL).click()
      await page.getByTestId('token-option-1-USDT').first().click()
    })

    test('can enter an amount into input', async ({ page }) => {
      await page.getByTestId(TestID.AmountInputIn).clear()
      await page.getByTestId(TestID.AmountInputIn).fill('0.001')
      await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue('0.001')
    })

    test('zero swap amount', async ({ page }) => {
      await page.getByTestId(TestID.AmountInputIn).clear()
      await page.getByTestId(TestID.AmountInputIn).fill('0.0')
      await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue('0.0')
    })

    test('invalid swap amount', async ({ page }) => {
      await page.getByTestId(TestID.AmountInputIn).clear()
      await page.getByTestId(TestID.AmountInputIn).fill('\\')
      await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue('')
    })
  })

  test.describe('swap output', () => {
    test('can enter an amount into output', async ({ page }) => {
      await page.getByTestId(TestID.AmountInputOut).clear()
      await page.getByTestId(TestID.AmountInputOut).fill('0.001')
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue('0.001')
    })

    test('zero output amount', async ({ page }) => {
      await page.getByTestId(TestID.AmountInputOut).clear()
      await page.getByTestId(TestID.AmountInputOut).fill('0.0')
      await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue('0.0')
    })
  })
})
