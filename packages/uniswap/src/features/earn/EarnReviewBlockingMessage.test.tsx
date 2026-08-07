import { FetchError } from '@universe/api'
import type { AppTFunction } from 'ui/src/i18n/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  EarnReviewBlockingMessage,
  getEarnDepositQuoteErrorMessage,
} from 'uniswap/src/features/earn/EarnReviewBlockingMessage'
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

  it('links self-funded destination gas quote failures to Earn troubleshooting help', () => {
    const quoteError = new FetchError({
      response: new Response(null, { status: 422 }),
      data: {
        errorCode: 'UnprocessableEntity',
        detail: 'Bridged amount is insufficient to cover gas costs for destination swap',
      },
    })

    render(
      <EarnReviewBlockingMessage
        executionErrorMessage={undefined}
        hasQuoteError
        insufficientGasWarning={noInsufficientGasWarning}
        quoteError={quoteError}
        quoteErrorMessage="Not enough ETH on Ethereum"
        showTroubleshootingLink={false}
      />,
    )

    expect(screen.getByText('Not enough ETH on Ethereum')).toBeDefined()
    expect(screen.getByText('Learn more')).toBeDefined()
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

describe(getEarnDepositQuoteErrorMessage, () => {
  it('maps self-funded destination gas failures to the destination native currency and chain', () => {
    const error = new FetchError({
      response: new Response(null, { status: 422 }),
      data: {
        errorCode: 'UnprocessableEntity',
        detail: 'Bridged amount is insufficient to cover gas costs for destination swap',
      },
    })
    const t = vi.fn(
      (key: string, values?: { networkName?: string; tokenSymbol?: string }): string =>
        `${key}:${values?.tokenSymbol}:${values?.networkName}`,
    ) as unknown as AppTFunction

    expect(
      getEarnDepositQuoteErrorMessage({
        hasQuoteError: true,
        error,
        destinationChainId: UniverseChainId.Mainnet,
        t,
      }),
    ).toBe('transaction.warning.insufficientGas.modal.title.withNetwork:ETH:Ethereum')
  })
})
