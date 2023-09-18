import userEvent from '@testing-library/user-event'
import {
  TEST_ALLOWED_SLIPPAGE,
  TEST_TOKEN_1,
  TEST_TOKEN_2,
  TEST_TRADE_EXACT_INPUT,
  TEST_TRADE_FEE_ON_BUY,
  TEST_TRADE_FEE_ON_SELL,
} from 'test-utils/constants'
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
    TEST_TRADE_EXACT_INPUT.gasUseEstimateUSD = 1.0
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

  it('renders fee on input transfer information', async () => {
    render(
      <SwapDetailsDropdown
        trade={TEST_TRADE_FEE_ON_SELL}
        syncing={false}
        loading={true}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
      />
    )
    await act(() => userEvent.click(screen.getByTestId('swap-details-header-row')))

    expect(
      screen.getByText(
        'Some tokens take a fee when they are bought or sold, which is set by the token issuer. Uniswap does not receive any of these fees.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText(`${TEST_TOKEN_1.symbol} fee`)).toBeInTheDocument()
  })

  it('renders fee on ouput transfer information', async () => {
    render(
      <SwapDetailsDropdown
        trade={TEST_TRADE_FEE_ON_BUY}
        syncing={false}
        loading={true}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
      />
    )
    await act(() => userEvent.click(screen.getByTestId('swap-details-header-row')))

    expect(
      screen.getByText(
        'Some tokens take a fee when they are bought or sold, which is set by the token issuer. Uniswap does not receive any of these fees.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText(`${TEST_TOKEN_2.symbol} fee`)).toBeInTheDocument()
  })
})
