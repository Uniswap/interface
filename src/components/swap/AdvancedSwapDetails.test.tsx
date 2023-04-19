import {
  TEST_ALLOWED_SLIPPAGE,
  TEST_TOKEN_1,
  TEST_TRADE_EXACT_INPUT,
  TEST_TRADE_EXACT_OUTPUT,
  toCurrencyAmount,
} from 'test-utils/constants'
import { fireEvent, render, screen } from 'test-utils/render'

import { AdvancedSwapDetails } from './AdvancedSwapDetails'

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})

describe('AdvancedSwapDetails.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <AdvancedSwapDetails trade={TEST_TRADE_EXACT_INPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />
    )
    expect(asFragment()).toMatchSnapshot()
  })

  it('test trade with exact input', async () => {
    render(<AdvancedSwapDetails trade={TEST_TRADE_EXACT_INPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />)
    fireEvent.mouseOver(screen.getByText('Price Impact'))
    expect(await screen.findByText(/The impact your trade has on the market price of this pool./i)).toBeVisible()
    fireEvent.mouseOver(screen.getByText('Expected Output'))
    expect(await screen.findByText(/The amount you expect to receive at the current market price./i)).toBeVisible()
    fireEvent.mouseOver(screen.getByText(/Minimum received/i))
    expect(await screen.findByText(/The minimum amount you are guaranteed to receive./i)).toBeVisible()
  })

  it('test trade with exact output, and with gas use estimate USD', async () => {
    TEST_TRADE_EXACT_OUTPUT.gasUseEstimateUSD = toCurrencyAmount(TEST_TOKEN_1, 1)
    render(<AdvancedSwapDetails trade={TEST_TRADE_EXACT_OUTPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />)
    fireEvent.mouseOver(screen.getByText(/Maximum sent/i))
    expect(await screen.findByText(/The minimum amount you are guaranteed to receive./i)).toBeVisible()
    fireEvent.mouseOver(screen.getByText('Network Fee'))
    expect(await screen.findByText(/The fee paid to miners who process your transaction./i)).toBeVisible()
  })

  it('renders loading rows when syncing', async () => {
    render(
      <AdvancedSwapDetails trade={TEST_TRADE_EXACT_OUTPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} syncing={true} />
    )
    expect(screen.getAllByTestId('loading-rows').length).toBeGreaterThan(0)
  })
})
