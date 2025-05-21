import { SwapEventName } from '@uniswap/analytics-events'
import { expect, test } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

test.describe('Time-to-swap logging', () => {
  test('completes two swaps and verifies the TTS logging for the first, plus all intermediate steps along the way', async ({
    page,
    amplitude,
  }) => {
    await stubTradingApiEndpoint(page, uniswapUrls.tradingApiPaths.swap)
    await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

    // First swap in the session:
    // Enter amount to swap
    await page.getByTestId(TestID.AmountInputIn).click()
    await page.getByTestId(TestID.AmountInputIn).fill('.1')

    // Verify first swap action
    await amplitude.waitForEvent(SwapEventName.SWAP_FIRST_ACTION).then((event: any) => {
      expect(event.event_properties).toHaveProperty('time_to_first_swap_action')
      expect(typeof event.event_properties.time_to_first_swap_action).toBe('number')
      expect(event.event_properties.time_to_first_swap_action).toBeGreaterThanOrEqual(0)
    })

    // Verify Swap Quote
    await amplitude.waitForEvent(SwapEventName.SWAP_QUOTE_FETCH).then((event: any) => {
      expect(event.event_properties).toHaveProperty('time_to_first_quote_request')
      expect(typeof event.event_properties.time_to_first_quote_request).toBe('number')
      expect(event.event_properties.time_to_first_quote_request).toBeGreaterThanOrEqual(0)
      expect(event.event_properties.time_to_first_quote_request_since_first_input).toBeDefined()
      expect(typeof event.event_properties.time_to_first_quote_request_since_first_input).toBe('number')
      expect(event.event_properties.time_to_first_quote_request_since_first_input).toBeGreaterThanOrEqual(0)
    })

    // Submit transaction
    await page.getByTestId(TestID.ReviewSwap).click()
    await page.getByTestId(TestID.Swap).click()

    // Verify logging
    await amplitude.waitForEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED).then((event: any) => {
      expect(event.event_properties).toHaveProperty('time_to_swap')
      expect(typeof event.event_properties.time_to_swap).toBe('number')
      expect(event.event_properties.time_to_swap).toBeGreaterThanOrEqual(0)
      expect(event.event_properties).toHaveProperty('time_to_swap_since_first_input')
      expect(typeof event.event_properties.time_to_swap_since_first_input).toBe('number')
      expect(event.event_properties.time_to_swap_since_first_input).toBeGreaterThanOrEqual(0)
    })

    // Second swap in the session:
    // Enter amount to swap (different from first trade, to trigger a new quote request)
    await page.getByTestId(TestID.AmountInputOut).fill('10')
    await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue(/.+/)

    // Verify second Swap Quote
    await amplitude.waitForEvent(SwapEventName.SWAP_QUOTE_FETCH).then((event: any) => {
      expect(event.event_properties.time_to_first_quote_request).toBeUndefined()
      expect(event.event_properties.time_to_first_quote_request_since_first_input).toBeUndefined()
    })

    // Submit transaction
    await page.getByTestId(TestID.ReviewSwap).click()
    await page.getByTestId(TestID.Swap).click()

    // Verify second swap completion logging does not include TTS properties
    await amplitude.waitForEvent(SwapEventName.SWAP_TRANSACTION_COMPLETED).then((event: any) => {
      expect(event.event_properties).not.toHaveProperty('time_to_swap')
      expect(event.event_properties).not.toHaveProperty('time_to_swap_since_first_input')
    })
  })
})
