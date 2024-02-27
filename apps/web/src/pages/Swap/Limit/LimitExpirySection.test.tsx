import { Expiry, LimitContext } from 'state/limit/LimitContext'
import { render } from 'test-utils/render'

import { LimitExpirySection } from './LimitExpirySection'

const mockLimitContextValue = {
  limitState: {
    inputAmount: '',
    limitPrice: '100',
    limitPriceEdited: false,
    limitPriceInverted: false,
    outputAmount: '',
    expiry: Expiry.Day,
    isInputAmountFixed: true,
  },
  setLimitState: jest.fn(),
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
      </LimitContext.Provider>
    )
    expect(result.getByText('Expiry')).toBeInTheDocument()
    expect(result.getByText('1 day')).toBeInTheDocument()
    expect(result.getByText('1 week')).toBeInTheDocument()
    expect(result.getByText('1 month')).toBeInTheDocument()
    expect(result.getByText('1 year')).toBeInTheDocument()
  })

  it('should call the callback when clicking unselected option', () => {
    const callback = jest.fn()
    const result = render(
      <LimitContext.Provider value={{ ...mockLimitContextValue, setLimitState: callback }}>
        <LimitExpirySection />
      </LimitContext.Provider>
    )
    result.getByText('1 month').click()
    expect(callback).toHaveBeenCalled()
  })

  it('should not call the callback when clicking selected option', () => {
    const callback = jest.fn()
    const result = render(
      <LimitContext.Provider value={{ ...mockLimitContextValue, setLimitState: callback }}>
        <LimitExpirySection />
      </LimitContext.Provider>
    )
    result.getByText('1 day').click()
    expect(callback).not.toHaveBeenCalled()
  })
})
