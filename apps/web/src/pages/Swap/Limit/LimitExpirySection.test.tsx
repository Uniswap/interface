import { LimitExpirySection } from 'pages/Swap/Limit/LimitExpirySection'
import { LimitContext } from 'state/limit/LimitContext'
import { render } from 'test-utils/render'
import { LimitsExpiry } from 'uniswap/src/types/limits'

const mockLimitContextValue = {
  limitState: {
    inputAmount: '',
    limitPrice: '100',
    limitPriceEdited: false,
    limitPriceInverted: false,
    outputAmount: '',
    expiry: LimitsExpiry.Day,
    isInputAmountFixed: true,
  },
  setLimitState: vi.fn(),
  derivedLimitInfo: {
    currencyBalances: {},
    parsedAmounts: {},
  },
}

describe('LimitExpirySection', () => {
  it('should render the correct label', () => {
    const result = render(
      <LimitContext.Provider value={mockLimitContextValue}>
        <LimitExpirySection />
      </LimitContext.Provider>,
    )
    expect(result.getByText('Expiry')).toBeInTheDocument()
    expect(result.getByText('1 day')).toBeInTheDocument()
    expect(result.getByText('1 week')).toBeInTheDocument()
    expect(result.getByText('1 month')).toBeInTheDocument()
    expect(result.getByText('1 year')).toBeInTheDocument()
  })

  it('should call the callback when clicking unselected option', () => {
    const callback = vi.fn()
    const result = render(
      <LimitContext.Provider value={{ ...mockLimitContextValue, setLimitState: callback }}>
        <LimitExpirySection />
      </LimitContext.Provider>,
    )
    result.getByText('1 month').click()
    expect(callback).toHaveBeenCalled()
  })

  it('should not call the callback when clicking selected option', () => {
    const callback = vi.fn()
    const result = render(
      <LimitContext.Provider value={{ ...mockLimitContextValue, setLimitState: callback }}>
        <LimitExpirySection />
      </LimitContext.Provider>,
    )
    result.getByText('1 day').click()
    expect(callback).not.toHaveBeenCalled()
  })
})
