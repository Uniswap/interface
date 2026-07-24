import { TradingApi } from '@universe/api'
import { PendingSwapButtonContent } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/PendingSwapButtonContent'
import { render, screen } from 'uniswap/src/test/test-utils'

describe(PendingSwapButtonContent, () => {
  // Regression guard for CONS-2613/CONS-2645: Earn renders this outside SwapReviewScreen's
  // store providers, so it must never depend on the swap review stores.
  it('renders plan progress without swap review store providers', () => {
    render(
      <PendingSwapButtonContent
        disabled
        currentStepIndex={1}
        steps={[{ stepType: TradingApi.PlanStepType.VAULT_WITHDRAW, tokenInChainId: TradingApi.ChainId._1 }]}
        submissionText="Withdrawing…"
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('Withdrawing…')).toBeDefined()
  })

  it('falls back to the delayed submission text when no submission text is given', () => {
    render(<PendingSwapButtonContent disabled currentStepIndex={0} steps={undefined} onSubmit={vi.fn()} />)

    expect(screen.getByText('swap.button.submitting')).toBeDefined()
  })
})
