import { TEST_ALLOWED_SLIPPAGE, TEST_TOKEN_1, TEST_TRADE_EXACT_INPUT, toCurrencyAmount } from 'test-utils/constants'
import { fireEvent, render, screen } from 'test-utils/render'

import SwapDetailsDropdown from './SwapDetailsDropdown'

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})

describe('SwapDetailsDropdown.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <SwapDetailsDropdown
        trade={TEST_TRADE_EXACT_INPUT}
        syncing={false}
        loading={false}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
      />
    )
    expect(asFragment()).toMatchSnapshot()
    fireEvent.mouseOver(screen.getByTestId('info-icon'))
    expect(screen.getByTestId('advanced-swap-details-tooltip-content')).toBeInTheDocument()
  })

  it('loading state contains expected elements', () => {
    render(
      <SwapDetailsDropdown trade={undefined} syncing={true} loading={true} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />
    )
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    expect(screen.getByText('Fetching best price...')).toBeInTheDocument()
  })

  it('interactive components work as expected once trade is loaded', () => {
    TEST_TRADE_EXACT_INPUT.gasUseEstimateUSD = toCurrencyAmount(TEST_TOKEN_1, 1)
    render(
      <SwapDetailsDropdown
        trade={TEST_TRADE_EXACT_INPUT}
        syncing={false}
        loading={false}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
      />
    )

    expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    expect(screen.getByTestId('swap-details-header-row')).toBeInTheDocument()
    expect(screen.getByTestId('trade-price-container')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('swap-details-header-row'))
    expect(screen.getByTestId('advanced-swap-details')).toBeInTheDocument()
    expect(screen.getByTestId('swap-route-info')).toBeInTheDocument()
  })
})
