import { testAllowedSlippage, testCurrencyAmount, testToken1, testTradeExactInput } from 'test-utils/constants'
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
        trade={testTradeExactInput}
        syncing={false}
        loading={false}
        allowedSlippage={testAllowedSlippage}
      />
    )
    expect(asFragment()).toMatchSnapshot()
    fireEvent.mouseOver(screen.getByTestId('info-icon'))
    expect(screen.getByTestId('advanced-swap-details-tooltip-content')).toBeInTheDocument()
  })

  it('loading state contains expected elements', () => {
    render(
      <SwapDetailsDropdown trade={undefined} syncing={true} loading={true} allowedSlippage={testAllowedSlippage} />
    )
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    expect(screen.getByText('Fetching best price...')).toBeInTheDocument()
  })

  it('interactive components work as expected once trade is loaded', () => {
    testTradeExactInput.gasUseEstimateUSD = testCurrencyAmount(testToken1, 1)
    render(
      <SwapDetailsDropdown
        trade={testTradeExactInput}
        syncing={false}
        loading={false}
        allowedSlippage={testAllowedSlippage}
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
