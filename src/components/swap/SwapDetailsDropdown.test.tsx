import userEvent from '@testing-library/user-event'
import { TEST_ALLOWED_SLIPPAGE, TEST_TOKEN_1, TEST_TRADE_EXACT_INPUT, toCurrencyAmount } from 'test-utils/constants'
import { act, render, screen } from 'test-utils/render'

import SwapDetailsDropdown from './SwapDetailsDropdown'

describe('SwapDetailsDropdown.tsx', () => {
  it('renders a trade', () => {
    const { asFragment } = render(
      <SwapDetailsDropdown
        trade={TEST_TRADE_EXACT_INPUT}
        syncing={false}
        loading={false}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders loading state', () => {
    render(
      <SwapDetailsDropdown trade={undefined} syncing={true} loading={true} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />
    )
    expect(screen.getByText('Fetching best price...')).toBeInTheDocument()
  })

  it('is interactive once loaded', async () => {
    TEST_TRADE_EXACT_INPUT.gasUseEstimateUSD = toCurrencyAmount(TEST_TOKEN_1, 1)
    render(
      <SwapDetailsDropdown
        trade={TEST_TRADE_EXACT_INPUT}
        syncing={false}
        loading={false}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
      />
    )
    expect(screen.getByTestId('swap-details-header-row')).toBeInTheDocument()
    expect(screen.getByTestId('trade-price-container')).toBeInTheDocument()
    await act(() => userEvent.click(screen.getByTestId('swap-details-header-row')))
    expect(screen.getByTestId('advanced-swap-details')).toBeInTheDocument()
  })
})
