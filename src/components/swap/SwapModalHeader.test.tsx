import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { TEST_ALLOWED_SLIPPAGE, TEST_TRADE_EXACT_INPUT, TEST_TRADE_EXACT_OUTPUT } from 'test-utils/constants'
import { render, screen } from 'test-utils/render'

import SwapModalHeader from './SwapModalHeader'

describe('SwapModalHeader.tsx', () => {
  it('matches base snapshot, test trade exact input', () => {
    const { asFragment } = render(
      <SwapModalHeader trade={TEST_TRADE_EXACT_INPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText(/Output is estimated. You will receive at least /i)).toBeInTheDocument()
    expect(screen.getByTestId('INPUT-amount')).toHaveTextContent(
      `${formatCurrencyAmount(TEST_TRADE_EXACT_INPUT.inputAmount, NumberType.TokenTx)} ${
        TEST_TRADE_EXACT_INPUT.inputAmount.currency.symbol ?? ''
      }`
    )
    expect(screen.getByTestId('OUTPUT-amount')).toHaveTextContent(
      `${formatCurrencyAmount(TEST_TRADE_EXACT_INPUT.outputAmount, NumberType.TokenTx)} ${
        TEST_TRADE_EXACT_INPUT.outputAmount.currency.symbol ?? ''
      }`
    )
  })

  it('test trade exact output, no recipient', () => {
    const { asFragment } = render(
      <SwapModalHeader trade={TEST_TRADE_EXACT_OUTPUT} allowedSlippage={TEST_ALLOWED_SLIPPAGE} />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText(/Input is estimated. You will sell at most/i)).toBeInTheDocument()

    expect(screen.getByTestId('INPUT-amount')).toHaveTextContent(
      `${formatCurrencyAmount(TEST_TRADE_EXACT_OUTPUT.inputAmount, NumberType.TokenTx)} ${
        TEST_TRADE_EXACT_OUTPUT.inputAmount.currency.symbol ?? ''
      }`
    )
    expect(screen.getByTestId('OUTPUT-amount')).toHaveTextContent(
      `${formatCurrencyAmount(TEST_TRADE_EXACT_OUTPUT.outputAmount, NumberType.TokenTx)} ${
        TEST_TRADE_EXACT_OUTPUT.outputAmount.currency.symbol ?? ''
      }`
    )
  })
})
