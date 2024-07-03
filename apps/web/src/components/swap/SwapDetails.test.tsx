import { Percent } from '@uniswap/sdk-core'
import { SwapDetails } from 'components/swap/SwapDetails'
import { SlippageTooltipContent } from 'components/swap/SwapLineItem'
import {
  LIMIT_ORDER_TRADE,
  PREVIEW_EXACT_IN_TRADE,
  TEST_ALLOWED_SLIPPAGE,
  TEST_TRADE_EXACT_INPUT,
} from 'test-utils/constants'
import { render, renderHook, screen, within } from 'test-utils/render'
import { NumberType, useFormatter } from 'utils/formatNumbers'

describe('SwapDetails.tsx', () => {
  it('matches base snapshot, test trade exact input', () => {
    const { formatCurrencyAmount } = renderHook(() => useFormatter()).result.current
    const { asFragment } = render(
      <SwapDetails
        isLoading={false}
        trade={TEST_TRADE_EXACT_INPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        swapResult={undefined}
        onConfirm={jest.fn()}
        swapErrorMessage={undefined}
        disabledConfirm={false}
        priceImpact={new Percent(5, 100)}
        fiatValueInput={{
          data: undefined,
          isLoading: false,
        }}
        fiatValueOutput={{
          data: undefined,
          isLoading: false,
        }}
        showAcceptChanges={false}
        onAcceptChanges={jest.fn()}
      />,
    )
    expect(asFragment()).toMatchSnapshot()

    const tradeMinAmount = TEST_TRADE_EXACT_INPUT.minimumAmountOut(TEST_ALLOWED_SLIPPAGE ?? new Percent(0))
    const formattedAmount = formatCurrencyAmount({ amount: tradeMinAmount, type: NumberType.SwapDetailsAmount })

    expect(
      screen.getByText(
        `If the price moves so that you will receive less than ${formattedAmount} ${tradeMinAmount.currency.symbol}, your transaction will revert.`,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('The impact your trade has on the market price of this pool.')).toBeInTheDocument()
    expect(screen.getByText('The maximum price movement before your transaction will revert.')).toBeInTheDocument()
  })

  it('shows accept changes section when available', () => {
    const mockAcceptChanges = jest.fn()
    render(
      <SwapDetails
        isLoading={false}
        trade={TEST_TRADE_EXACT_INPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        swapResult={undefined}
        onConfirm={jest.fn()}
        swapErrorMessage={undefined}
        disabledConfirm={false}
        fiatValueInput={{
          data: undefined,
          isLoading: false,
        }}
        fiatValueOutput={{
          data: undefined,
          isLoading: false,
        }}
        showAcceptChanges={true}
        onAcceptChanges={mockAcceptChanges}
      />,
    )
    const showAcceptChanges = screen.getByTestId('show-accept-changes')
    expect(showAcceptChanges).toBeInTheDocument()
    expect(within(showAcceptChanges).getByText('Price updated')).toBeVisible()
    expect(within(showAcceptChanges).getByText('Accept')).toBeVisible()
  })

  it('renders a preview trade while disabling submission', () => {
    const { asFragment } = render(
      <SwapDetails
        isLoading
        trade={PREVIEW_EXACT_IN_TRADE}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        swapResult={undefined}
        onConfirm={jest.fn()}
        swapErrorMessage={undefined}
        disabledConfirm
        fiatValueInput={{
          data: undefined,
          isLoading: false,
        }}
        fiatValueOutput={{
          data: undefined,
          isLoading: false,
        }}
        showAcceptChanges={false}
        onAcceptChanges={jest.fn()}
      />,
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('Finalizing quote...')).toBeInTheDocument()
  })

  it('renders a limit trade', () => {
    render(
      <SwapDetails
        isLoading
        trade={LIMIT_ORDER_TRADE}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        swapResult={undefined}
        onConfirm={jest.fn()}
        swapErrorMessage={undefined}
        disabledConfirm={false}
        fiatValueInput={{
          data: undefined,
          isLoading: false,
        }}
        fiatValueOutput={{
          data: undefined,
          isLoading: false,
        }}
        showAcceptChanges={false}
        onAcceptChanges={jest.fn()}
      />,
    )
    expect(screen.getByText('Limit price')).toBeInTheDocument()
    expect(screen.getByText('Expiry')).toBeInTheDocument()
    expect(screen.getByText('Fee')).toBeInTheDocument()
    expect(screen.getByText('Network cost')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Please be aware that the execution for limits may vary based on real-time market fluctuations and Ethereum network congestion. Limits may not execute exactly when tokens reach the specified price.',
      ),
    ).toBeInTheDocument()
  })

  it('renders slippage tooltip', () => {
    const { asFragment } = render(<SlippageTooltipContent />)
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('The maximum price movement before your transaction will revert.')).toBeInTheDocument()
  })
})
