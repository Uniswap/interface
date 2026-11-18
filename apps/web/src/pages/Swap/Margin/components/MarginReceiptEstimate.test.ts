import { CurrencyAmount } from '@uniswap/sdk-core'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { estimateMarginReceipt } from '~/pages/Swap/Margin/components/MarginReceiptEstimate'

// $1,000 in at 3x against a $2,000 mark: a $3,000 position.
const estimate = (direction: MarginDirection, usd = 1000): ReturnType<typeof estimateMarginReceipt> =>
  estimateMarginReceipt({
    derivedMarginInfo: {
      market: getDefaultMarginMarket(),
      direction,
      leverage: 3,
      paymentUsdValue: CurrencyAmount.fromRawAmount(USDC_MAINNET, usd * 1e6),
    },
    mark: 2000,
  })

describe(estimateMarginReceipt, () => {
  it.each([
    // A long borrows (L − 1)·E of the quote leg.
    { direction: MarginDirection.LONG, borrowing: 2000 },
    // A short owes its whole exposure.
    { direction: MarginDirection.SHORT, borrowing: 1.5 },
  ])('sizes a $direction from the entered dollars', ({ direction, borrowing }) => {
    const result = estimate(direction)
    expect(result).toMatchObject({ size: 1.5, borrowing, entryPrice: 2000 })
    expect(result?.liquidationPrice).toBeDefined()
  })

  it('estimates nothing without an amount', () => {
    expect(estimate(MarginDirection.LONG, 0)).toBeUndefined()
  })
})
