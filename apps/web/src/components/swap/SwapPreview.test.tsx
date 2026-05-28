import 'test-utils/tokens/mocks'

import { SwapPreview } from 'components/swap/SwapPreview'
import {
  ETH_MAINNET,
  PREVIEW_EXACT_IN_TRADE,
  TEST_ALLOWED_SLIPPAGE,
  TEST_DUTCH_TRADE_ETH_INPUT,
  TEST_DUTCH_V2_TRADE_ETH_INPUT,
  TEST_TOKEN_2,
  TEST_TRADE_EXACT_INPUT,
  TEST_TRADE_EXACT_OUTPUT,
} from 'test-utils/constants'
import { render, screen } from 'test-utils/render'

describe('SwapPreview.tsx', () => {
  it('matches base snapshot, test trade exact input', () => {
    const { asFragment } = render(
      <SwapPreview trade={TEST_TRADE_EXACT_INPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />,
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText(/Output is estimated. You will receive at least /i)).toBeInTheDocument()
    expect(screen.getByTestId('input-amount')).toHaveTextContent(`<0.00001 ABC`)
    expect(screen.getByTestId('output-amount')).toHaveTextContent(`<0.00001 DEF`)
  })

  it('renders ETH input token for an ETH input UniswapX swap', () => {
    const { asFragment } = render(
      <SwapPreview
        inputCurrency={ETH_MAINNET}
        trade={TEST_DUTCH_TRADE_ETH_INPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
      />,
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText(/Output is estimated. You will receive at least /i)).toBeInTheDocument()
    expect(screen.getByTestId('input-amount')).toHaveTextContent(`<0.00001 ETH`)
    expect(screen.getByTestId('output-amount')).toHaveTextContent(`<0.00001 DEF`)
  })

  it('renders ETH input token for an ETH input UniswapX v2 swap', () => {
    const { asFragment } = render(
      <SwapPreview
        inputCurrency={ETH_MAINNET}
        trade={TEST_DUTCH_V2_TRADE_ETH_INPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
      />,
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText(/Output is estimated. You will receive at least /i)).toBeInTheDocument()
    expect(screen.getByTestId('input-amount')).toHaveTextContent(`<0.00001 ETH`)
    expect(screen.getByTestId('output-amount')).toHaveTextContent(`<0.00001 DEF`)
  })

  it('test trade exact output, no recipient', () => {
    const { asFragment } = render(
      <SwapPreview trade={TEST_TRADE_EXACT_OUTPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />,
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText(/Input is estimated. You will sell at most/i)).toBeInTheDocument()

    expect(screen.getByTestId('input-amount')).toHaveTextContent(`<0.00001 ABC`)
    expect(screen.getByTestId('output-amount')).toHaveTextContent(`<0.00001 GHI`)
  })

  it('renders preview trades with loading states', () => {
    const { asFragment } = render(
      <SwapPreview
        inputCurrency={TEST_TOKEN_2}
        trade={PREVIEW_EXACT_IN_TRADE}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
      />,
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
