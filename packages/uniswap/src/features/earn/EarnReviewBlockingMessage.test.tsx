import { EarnReviewBlockingMessage } from 'uniswap/src/features/earn/EarnReviewBlockingMessage'
import type { useEarnInsufficientGasWarning } from 'uniswap/src/features/earn/hooks/useEarnInsufficientGasWarning'
import { render, screen } from 'uniswap/src/test/test-utils'

const noInsufficientGasWarning = {
  hasInsufficientGas: false,
} as ReturnType<typeof useEarnInsufficientGasWarning>

describe(EarnReviewBlockingMessage, () => {
  it('links execution failures to Earn troubleshooting help', () => {
    render(
      <EarnReviewBlockingMessage
        executionErrorMessage="Transaction failed. Please try again."
        hasQuoteError={false}
        insufficientGasWarning={noInsufficientGasWarning}
        quoteErrorMessage={undefined}
        showTroubleshootingLink
      />,
    )

    expect(screen.getByText('Transaction failed. Please try again.')).toBeDefined()
    expect(screen.getByText('Learn more')).toBeDefined()
  })

  it('renders quote failures without a Learn more link', () => {
    render(
      <EarnReviewBlockingMessage
        executionErrorMessage={undefined}
        hasQuoteError
        insufficientGasWarning={noInsufficientGasWarning}
        quoteErrorMessage="Unable to fetch a quote."
        showTroubleshootingLink={false}
      />,
    )

    expect(screen.getByText('Unable to fetch a quote.')).toBeDefined()
    expect(screen.queryByText('Learn more')).toBeNull()
  })

  it('renders wallet rejections without a Learn more link', () => {
    render(
      <EarnReviewBlockingMessage
        executionErrorMessage="Transaction rejected."
        hasQuoteError={false}
        insufficientGasWarning={noInsufficientGasWarning}
        quoteErrorMessage={undefined}
        showTroubleshootingLink={false}
      />,
    )

    expect(screen.getByText('Transaction rejected.')).toBeDefined()
    expect(screen.queryByText('Learn more')).toBeNull()
  })
})
