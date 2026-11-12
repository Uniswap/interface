import userEvent from '@testing-library/user-event'
import { TestID } from '@universe/test'
import { HooksSummaryCards } from '~/pages/Explore/tables/Hooks/HooksSummaryCards'
import { render, screen, within } from '~/test-utils/render'

vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: () => ({
    convertFiatAmountFormatted: (value: number) => (value === 0 ? '$0.00' : `USD ${value}`),
  }),
}))

describe('HooksSummaryCards', () => {
  it('shows authoritative zero totals without calling them unavailable', () => {
    render(<HooksSummaryCards loading={false} summary={{ totalHooks: 0, volumeAllTimeUsd: 0, tvlUsd: 0 }} />)

    const summary = within(screen.getByTestId(TestID.HooksSummary))
    expect(summary.getByText('0')).toBeInTheDocument()
    expect(summary.getAllByText('$0.00')).toHaveLength(2)
    expect(summary.getByText('Total hooked pools volume')).toBeInTheDocument()
    expect(summary.queryByText('Unavailable')).not.toBeInTheDocument()
    expect(summary.queryByText('Preview · Sample data')).not.toBeInTheDocument()
    expect(
      summary.queryByText('Volume and TVL include available activity only; some metrics are unavailable.'),
    ).not.toBeInTheDocument()
  })

  it('keeps a known group count and unavailable metrics without a partial summary note', () => {
    render(<HooksSummaryCards loading={false} summary={{ totalHooks: 7, volumeAllTimeUsd: null, tvlUsd: null }} />)

    const summary = within(screen.getByTestId(TestID.HooksSummary))
    expect(summary.getByText('7')).toBeInTheDocument()
    expect(summary.getAllByText('Unavailable')).toHaveLength(2)
    expect(summary.queryByText('$0.00')).not.toBeInTheDocument()
    expect(
      summary.queryByText('Volume and TVL include available activity only; some metrics are unavailable.'),
    ).not.toBeInTheDocument()
  })

  it('communicates loading without substituting zero totals', () => {
    render(<HooksSummaryCards loading />)

    const summary = screen.getByTestId(TestID.HooksSummary)
    expect(summary.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(within(summary).queryByText('0')).not.toBeInTheDocument()
    expect(within(summary).queryByText('$0.00')).not.toBeInTheDocument()
  })

  it('distinguishes a failed request from unavailable data and keeps its skeletons still', () => {
    render(<HooksSummaryCards loading={false} error />)

    const summary = screen.getByTestId(TestID.HooksSummary)
    expect(within(summary).getByRole('status')).toHaveTextContent('Couldn’t load hook totals.')
    expect(summary.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    expect(summary.querySelector('[style*="animation-name"]')).not.toBeInTheDocument()
    expect(within(summary).queryByText('—')).not.toBeInTheDocument()
    expect(within(summary).queryByText('Unavailable')).not.toBeInTheDocument()
    expect(within(summary).queryByText('$0.00')).not.toBeInTheDocument()
    expect(within(summary).queryByText('Preview · Sample data')).not.toBeInTheDocument()
  })

  it('retries the summary independently when totals fail', async () => {
    const onRetry = vi.fn()
    render(<HooksSummaryCards loading={false} error onRetry={onRetry} />)

    await userEvent.click(within(screen.getByTestId(TestID.HooksSummary)).getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('replaces the failed state with loading and then the recovered summary', () => {
    const { rerender } = render(<HooksSummaryCards loading={false} error />)

    rerender(<HooksSummaryCards loading />)
    const summary = screen.getByTestId(TestID.HooksSummary)
    expect(within(summary).queryByRole('status')).not.toBeInTheDocument()
    expect(summary.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(summary.querySelector('[style*="animation-name"]')).toBeInTheDocument()

    rerender(<HooksSummaryCards loading={false} summary={{ totalHooks: 7, volumeAllTimeUsd: 100, tvlUsd: null }} />)

    expect(within(summary).queryByRole('status')).not.toBeInTheDocument()
    expect(summary.querySelector('[aria-busy="true"]')).not.toBeInTheDocument()
    expect(within(summary).getByText('7')).toBeInTheDocument()
    expect(within(summary).getByText('USD 100')).toBeInTheDocument()
    expect(within(summary).getByText('Unavailable')).toBeInTheDocument()
    expect(
      within(summary).queryByText('Volume and TVL include available activity only; some metrics are unavailable.'),
    ).not.toBeInTheDocument()
  })
})
