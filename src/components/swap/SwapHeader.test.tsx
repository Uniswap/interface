import { TEST_ALLOWED_SLIPPAGE, TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'
import { render, screen } from 'test-utils/render'

import SwapHeader, { SwapTab } from './SwapHeader'

jest.mock('../../featureFlags/flags/limits', () => ({ useLimitsEnabled: () => true }))

describe('SwapHeader.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <SwapHeader
        trade={TEST_TRADE_EXACT_INPUT}
        selectedTab={SwapTab.Swap}
        autoSlippage={TEST_ALLOWED_SLIPPAGE}
        onClickTab={jest.fn()}
      />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('Swap')).toBeInTheDocument()
    expect(screen.getByText('Buy')).toBeInTheDocument()
    expect(screen.getByText('Limit')).toBeInTheDocument()
  })

  it('calls callback for switching tabs', () => {
    const onClickTab = jest.fn()
    render(
      <SwapHeader
        trade={TEST_TRADE_EXACT_INPUT}
        selectedTab={SwapTab.Swap}
        autoSlippage={TEST_ALLOWED_SLIPPAGE}
        onClickTab={onClickTab}
      />
    )
    screen.getByText('Limit').click()
    expect(onClickTab).toHaveBeenCalledWith(SwapTab.Limit)
  })
})
