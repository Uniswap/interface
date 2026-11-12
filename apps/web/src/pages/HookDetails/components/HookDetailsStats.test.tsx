import userEvent from '@testing-library/user-event'
import { NumberType } from 'utilities/src/format/types'
import { HookDetailsIndexingNote, HookDetailsStats } from '~/pages/HookDetails/components/HookDetailsStats'
import { fireEvent, render, screen, within } from '~/test-utils/render'

vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: () => ({
    convertFiatAmountFormatted: (value: number, type: NumberType) => `${value}:${type}`,
  }),
}))

const METRICS = {
  tvlUsd: 100,
  volumeAllTimeUsd: 200,
  volume30dUsd: 30,
  feesAllTimeUsd: 400,
}

describe('HookDetailsStats', () => {
  it('defaults to all-time values and previews volume on hover', async () => {
    render(<HookDetailsStats {...METRICS} />)
    const volume = screen.getByRole('button', { name: /Volume, All-time: 200/ })

    expect(within(volume).getByText(`200:${NumberType.FiatTokenStats}`)).toBeInTheDocument()
    expect(volume).toHaveAttribute('aria-pressed', 'false')
    await userEvent.hover(volume)
    expect(within(volume).getByText('30D')).toBeInTheDocument()
    expect(volume).toHaveAccessibleName(/Volume, 30D: 30/)
    expect(volume).toHaveAttribute('aria-pressed', 'false')
    expect(within(volume).getByText(`30:${NumberType.FiatTokenStats}`)).toBeInTheDocument()
    await userEvent.unhover(volume)
    expect(within(volume).getByText('All-time')).toBeInTheDocument()
    expect(volume).toHaveAccessibleName(/Volume, All-time: 200/)
  })

  it('keeps fees all-time with a visible caption and no period interaction', async () => {
    render(<HookDetailsStats {...METRICS} />)
    const fees = screen.getByText('Fees')

    expect(fees.nextElementSibling).toHaveTextContent('All-time')
    expect(screen.queryByRole('button', { name: /Fees/ })).not.toBeInTheDocument()
    await userEvent.hover(fees)
    await userEvent.click(fees)
    expect(screen.getByText(`400:${NumberType.FiatTokenStats}`)).toBeInTheDocument()
    expect(fees.nextElementSibling).toHaveTextContent('All-time')
    expect(screen.queryByText('30D')).not.toBeInTheDocument()
  })

  it('previews on keyboard focus and restores all-time after blur', async () => {
    render(
      <>
        <HookDetailsStats {...METRICS} />
        <button>After metrics</button>
      </>,
    )
    const volume = screen.getByRole('button', { name: /Volume/ })

    await userEvent.tab()
    expect(volume).toHaveFocus()
    expect(within(volume).getByText('30D')).toBeInTheDocument()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'After metrics' })).toHaveFocus()
    expect(within(volume).getByText('All-time')).toBeInTheDocument()
  })

  it('exposes keyboard pinning separately from the focus preview and retains it after blur', async () => {
    render(
      <>
        <HookDetailsStats {...METRICS} />
        <button>After metrics</button>
      </>,
    )
    const volume = screen.getByRole('button', { name: /Volume/ })

    await userEvent.tab()
    expect(within(volume).getByText('30D')).toBeInTheDocument()
    expect(volume).toHaveAttribute('aria-pressed', 'false')
    await userEvent.keyboard('{Enter}')
    expect(volume).toHaveAttribute('aria-pressed', 'true')
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'After metrics' })).toHaveFocus()
    expect(within(volume).getByText('30D')).toBeInTheDocument()
    await userEvent.tab({ shift: true })
    await userEvent.keyboard(' ')
    expect(volume).toHaveAttribute('aria-pressed', 'false')
    expect(within(volume).getByText('All-time')).toBeInTheDocument()
  })

  it('lets touch users select 30D and return to all-time without affecting the other metric', async () => {
    render(<HookDetailsStats {...METRICS} />)
    const volume = screen.getByRole('button', { name: /Volume/ })

    await userEvent.pointer({ keys: '[TouchA]', target: volume })
    expect(within(volume).getByText('30D')).toBeInTheDocument()
    expect(volume).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(`400:${NumberType.FiatTokenStats}`)).toBeInTheDocument()
    await userEvent.pointer({ keys: '[TouchA]', target: volume })
    expect(within(volume).getByText('All-time')).toBeInTheDocument()
    expect(volume).toHaveAttribute('aria-pressed', 'false')
  })

  it('formats literal zero as fiat and leaves unavailable data as a dash', () => {
    render(<HookDetailsStats {...METRICS} tvlUsd={0} volumeAllTimeUsd={0} feesAllTimeUsd={null} />)

    expect(screen.getAllByText(`0:${NumberType.FiatStandard}`)).toHaveLength(2)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('announces unavailable all-time volume and the numeric value when previewing available 30D data', async () => {
    render(<HookDetailsStats {...METRICS} volumeAllTimeUsd={null} />)
    const volume = screen.getByRole('button', { name: /Volume, All-time: Unavailable/ })

    expect(within(volume).getByText('—')).toHaveAttribute('aria-hidden', 'true')
    await userEvent.hover(volume)
    expect(volume).toHaveAccessibleName(/Volume, 30D: 30/)
    expect(within(volume).getByText(`30:${NumberType.FiatTokenStats}`)).not.toHaveAttribute('aria-hidden', 'true')
    await userEvent.unhover(volume)
    expect(volume).toHaveAccessibleName(/Volume, All-time: Unavailable/)
  })

  it('provides spoken unavailable text for noninteractive TVL while retaining its visual dash', () => {
    render(<HookDetailsStats {...METRICS} tvlUsd={null} />)

    expect(screen.getByText('—')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Unavailable')).toHaveClass('sr-only')
    expect(screen.queryByRole('button', { name: /TVL/ })).not.toBeInTheDocument()
  })

  it('keeps TVL independent of custom accounting and explains the unavailable volume and fees', async () => {
    render(<HookDetailsStats {...METRICS} customAccounting />)

    expect(screen.getByText(`100:${NumberType.FiatTokenStats}`)).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(screen.getAllByText('Unavailable')).toHaveLength(2)
    expect(screen.queryByText(`200:${NumberType.FiatTokenStats}`)).not.toBeInTheDocument()
    const explainer = screen.getByRole('button', { name: 'Custom Accounting hook' })
    fireEvent.focus(explainer)
    expect(
      await screen.findByText('This hook uses custom accounting. Standard volume and fee metrics are unavailable.'),
    ).toBeInTheDocument()
  })

  it('provides the explicit indexing footnote without converting missing metrics to zero', () => {
    render(
      <>
        <HookDetailsStats {...METRICS} tvlUsd={null} volumeAllTimeUsd={null} feesAllTimeUsd={null} />
        <HookDetailsIndexingNote />
      </>,
    )

    expect(screen.getAllByText('—')).toHaveLength(3)
    expect(screen.getByText('Some metrics are unavailable while this hook is being indexed.')).toBeInTheDocument()
  })
})
