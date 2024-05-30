import { LimitPriceErrorType } from 'components/CurrencyInputPanel/LimitPriceInputPanel/useCurrentPriceAdjustment'
import { DAI, USDC_MAINNET } from 'constants/tokens'
import { render } from 'test-utils/render'
import { LimitPriceError } from './LimitPriceError'

describe('LimitPriceError', () => {
  it.each([
    [true, 10],
    [false, 10],
    [true, -10],
    [false, -10],
  ])('renders the limit price error correctly, inverted %p change %p', async (inverted, change) => {
    const { container } = render(
      <LimitPriceError
        inputCurrency={DAI}
        outputCurrency={USDC_MAINNET}
        priceInverted={inverted}
        priceAdjustmentPercentage={change}
        priceError={LimitPriceErrorType.BELOW_MARKET}
      />
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
      />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
