import userEvent from '@testing-library/user-event'
import { TEST_ALLOWED_SLIPPAGE, TEST_TRADE_EXACT_INPUT, TEST_TRADE_EXACT_OUTPUT } from 'test-utils/constants'
import { act, render, screen } from 'test-utils/render'

import { AdvancedSwapDetails } from './AdvancedSwapDetails'

describe('AdvancedSwapDetails.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <AdvancedSwapDetails trade={TEST_TRADE_EXACT_INPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders correct copy on mouseover', async () => {
    render(<AdvancedSwapDetails trade={TEST_TRADE_EXACT_INPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />)
    await act(() => userEvent.hover(screen.getByText('Expected output')))
    expect(await screen.getByText(/The amount you expect to receive at the current market price./i)).toBeVisible()
    await act(() => userEvent.hover(screen.getByText(/Minimum output/i)))
    expect(await screen.getByText(/The minimum amount you are guaranteed to receive./i)).toBeVisible()
  })

  it('renders correct tooltips for test trade with exact output and gas use estimate USD', async () => {
    TEST_TRADE_EXACT_OUTPUT.gasUseEstimateUSD = '1.00'
    render(<AdvancedSwapDetails trade={TEST_TRADE_EXACT_OUTPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />)
    await act(() => userEvent.hover(screen.getByText(/Maximum input/i)))
    expect(await screen.getByText(/The minimum amount you are guaranteed to receive./i)).toBeVisible()
    await act(() => userEvent.hover(screen.getByText('Network fee')))
    expect(await screen.getByText(/The fee paid to miners who process your transaction./i)).toBeVisible()
  })

  it('renders loading rows when syncing', async () => {
    render(
      <AdvancedSwapDetails trade={TEST_TRADE_EXACT_OUTPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} syncing={true} />
    )
    expect(screen.getAllByTestId('loading-rows').length).toBeGreaterThan(0)
  })
})
