import { Expiry, LimitContext } from 'state/limit/LimitContext'
import { render } from 'test-utils/render'

import { LimitExpirySection } from './LimitExpirySection'

const mockLimitContextValue = {
  limitState: {
    inputAmount: '',
    limitPrice: '100',
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
    expect(result.getByText('1 Day')).toBeInTheDocument()
    expect(result.getByText('1 Week')).toBeInTheDocument()
    expect(result.getByText('1 Month')).toBeInTheDocument()
    expect(result.getByText('1 Year')).toBeInTheDocument()
  })

  it('should call the callback when clicking unselected option', () => {
    const callback = jest.fn()
    const result = render(
      <LimitContext.Provider value={{ ...mockLimitContextValue, setLimitState: callback }}>
        <LimitExpirySection />
      </LimitContext.Provider>
    )
    result.getByText('1 Month').click()
    expect(callback).toHaveBeenCalled()
  })

  it('should not call the callback when clicking selected option', () => {
    const callback = jest.fn()
    const result = render(
      <LimitContext.Provider value={{ ...mockLimitContextValue, setLimitState: callback }}>
        <LimitExpirySection />
      </LimitContext.Provider>
    )
    result.getByText('1 Day').click()
    expect(callback).not.toHaveBeenCalled()
  })
})
