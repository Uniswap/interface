import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { LimitPriceError, shouldShowLimitPriceError } from '~/pages/Swap/Limit/LimitPriceError'
import { LimitPriceErrorType } from '~/pages/Swap/Limit/LimitPriceInputPanel/useCurrentPriceAdjustment'
import { render } from '~/test-utils/render'

describe('LimitPriceError', () => {
  it.each([
    [true, 10],
    [false, 10],
    [true, -10],
    [false, -10],
  ])('renders the limit price error correctly, inverted %o change %o', async (inverted, change) => {
    const { container } = render(
      <LimitPriceError
        inputCurrency={DAI}
        outputCurrency={USDC_MAINNET}
        priceInverted={inverted}
        priceAdjustmentPercentage={change}
        priceError={LimitPriceErrorType.BELOW_MARKET}
      />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })

  it('renders the limit price error correctly when there is a calculation error', async () => {
    const { container } = render(
      <LimitPriceError
        inputCurrency={DAI}
        outputCurrency={USDC_MAINNET}
        priceInverted={false}
        priceAdjustmentPercentage={0}
        priceError={LimitPriceErrorType.CALCULATION_ERROR}
      />,
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})

describe('shouldShowLimitPriceError', () => {
  it('shows the banner for a rejected market-price reference even when no trade can be built', () => {
    // No wallet connected + cleared prefill means no LimitOrderTrade exists — the rejection must
    // still be explained instead of rendering a blank rate with a disabled Confirm.
    expect(
      shouldShowLimitPriceError({
        priceError: LimitPriceErrorType.CALCULATION_ERROR,
        hasLimitOrderTrade: false,
        marketPriceRejected: true,
      }),
    ).toBe(true)
  })

  it('stays hidden during ordinary quote loading on a healthy pair', () => {
    // priceError is CALCULATION_ERROR transiently while marketPrice is still loading — that alone
    // must not flash the banner.
    expect(
      shouldShowLimitPriceError({
        priceError: LimitPriceErrorType.CALCULATION_ERROR,
        hasLimitOrderTrade: false,
        marketPriceRejected: false,
      }),
    ).toBe(false)
  })

  it('keeps showing the below-market banner when a trade exists', () => {
    expect(
      shouldShowLimitPriceError({
        priceError: LimitPriceErrorType.BELOW_MARKET,
        hasLimitOrderTrade: true,
        marketPriceRejected: false,
      }),
    ).toBe(true)
  })

  it('never shows without a price error', () => {
    expect(
      shouldShowLimitPriceError({
        priceError: undefined,
        hasLimitOrderTrade: true,
        marketPriceRejected: true,
      }),
    ).toBe(false)
  })
})
