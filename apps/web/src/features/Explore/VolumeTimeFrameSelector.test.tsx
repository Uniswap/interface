import userEvent from '@testing-library/user-event'
import { TestID } from '@universe/test'
import type { FormEvent } from 'react'
import { Route, Routes } from 'react-router'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TimePeriod } from '~/data/util'
import {
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { LIVE_POOL_VOLUME_PERIODS } from '~/features/Explore/timeLabels'
import { VolumeTimeFrameSelector } from '~/features/Explore/VolumeTimeFrameSelector'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()),
  useMedia: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

function PeriodProbe(): JSX.Element {
  const timePeriod = useExploreTablesFilterStore((state) => state.timePeriod)
  const { setTimePeriod } = useExploreTablesFilterStoreActions()
  return (
    <>
      <output aria-label="Stored period">{timePeriod}</output>
      <button onClick={() => setTimePeriod(TimePeriod.HOUR)}>Set hour</button>
      <button onClick={() => setTimePeriod(TimePeriod.MONTH)}>Set month</button>
    </>
  )
}

function selectorTree(supportedPeriods?: readonly TimePeriod[]): JSX.Element {
  return (
    <ExploreTablesFilterStoreContextProvider>
      <Routes>
        <Route
          path="/explore/:tab/:chainName?"
          element={
            <>
              <VolumeTimeFrameSelector supportedPeriods={supportedPeriods} />
              <PeriodProbe />
            </>
          }
        />
      </Routes>
    </ExploreTablesFilterStoreContextProvider>
  )
}

describe('VolumeTimeFrameSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMediaSize('xxxl')
    window.history.replaceState(null, '', '/explore/tokens/ethereum')
  })

  it.each(['{Enter}', ' '])('opens with %s and returns focus after Escape', async (key) => {
    const user = userEvent.setup()
    render(selectorTree(LIVE_POOL_VOLUME_PERIODS))
    const trigger = screen.getByRole('button', { name: '1D volume' })

    await user.tab()
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard(key)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
    await user.keyboard('{Escape}')

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    expect(trigger).toHaveFocus()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Set hour' })).toHaveFocus()
  })

  it('selects a period with arrow keys and Enter exactly once, without submitting its form', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    render(<form onSubmit={onSubmit}>{selectorTree(LIVE_POOL_VOLUME_PERIODS)}</form>)
    const trigger = screen.getByRole('button', { name: '1D volume' })

    await user.tab()
    await user.keyboard('{Enter}{ArrowDown}{Enter}')

    await waitFor(() => expect(screen.getByLabelText('Stored period')).toHaveTextContent(/^M$/))
    expect(trigger).toHaveAccessibleName('30D volume')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(InterfaceEventName.ExploreTableFilterSelected, {
      filter_type: 'volume_time_period',
      filter_value: TimePeriod.MONTH,
    })
  })

  it('dismisses a pointer-opened menu with Escape and can reopen it', async () => {
    const user = userEvent.setup()
    render(selectorTree(LIVE_POOL_VOLUME_PERIODS))
    const trigger = screen.getByRole('button', { name: '1D volume' })

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    await user.keyboard(' ')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })

  it('does not pull focus from an outside control when the pointer dismisses the menu', async () => {
    const user = userEvent.setup()
    render(selectorTree(LIVE_POOL_VOLUME_PERIODS))
    const trigger = screen.getByRole('button', { name: '1D volume' })
    const outsideButton = screen.getByRole('button', { name: 'Set hour' })

    await user.click(trigger)
    await user.click(outsideButton)

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    expect(outsideButton).toHaveFocus()
    expect(screen.getByLabelText('Stored period')).toHaveTextContent(/^H$/)
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('keeps a complete accessible label for the narrow-screen trigger', async () => {
    const user = userEvent.setup()
    mockMediaSize('xs')
    render(selectorTree(LIVE_POOL_VOLUME_PERIODS))
    const trigger = screen.getByRole('button', { name: '1D volume' })

    expect(trigger).toHaveTextContent(/^1D\s*$/)
    await user.tab()
    await user.keyboard('{Enter}{ArrowDown} ')

    await waitFor(() => expect(screen.getByLabelText('Stored period')).toHaveTextContent(/^M$/))
    expect(trigger).toHaveAccessibleName('30D volume')
    expect(trigger).toHaveFocus()
  })

  it('derives a supported period without overwriting the Tokens selection', () => {
    const { rerender } = render(selectorTree(LIVE_POOL_VOLUME_PERIODS))
    fireEvent.click(screen.getByRole('button', { name: 'Set hour' }))

    expect(screen.getByTestId(TestID.TimeSelector)).toHaveTextContent('1D volume')
    expect(screen.getByLabelText('Stored period')).toHaveTextContent(/^H$/)
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()

    rerender(selectorTree())

    expect(screen.getByTestId(TestID.TimeSelector)).toHaveTextContent('1H volume')
    expect(screen.getByLabelText('Stored period')).toHaveTextContent(/^H$/)
  })

  it('offers only supported periods and records an explicit pick once', () => {
    render(selectorTree(LIVE_POOL_VOLUME_PERIODS))
    fireEvent.click(screen.getByTestId(TestID.TimeSelector))

    expect(screen.getByTestId('1D')).toHaveTextContent('1D volume')
    expect(screen.getByTestId('30D')).toHaveTextContent('30D volume')
    for (const label of ['1H', '1W', '1M', '1Y', 'All time', '7D']) {
      expect(screen.queryByTestId(label)).not.toBeInTheDocument()
    }

    fireEvent.click(screen.getByTestId('30D'))

    expect(screen.getByLabelText('Stored period')).toHaveTextContent(/^M$/)
    expect(screen.getByTestId(TestID.TimeSelector)).toHaveTextContent('30D volume')
    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(InterfaceEventName.ExploreTableFilterSelected, {
      filter_type: 'volume_time_period',
      filter_value: TimePeriod.MONTH,
    })
  })

  it('keeps the full Tokens options and their existing week/month labels by default', () => {
    render(selectorTree())
    fireEvent.click(screen.getByTestId(TestID.TimeSelector))

    for (const label of ['1H', '1D', '1W', '1M', '1Y', 'All time']) {
      expect(screen.getByTestId(label)).toHaveTextContent(`${label} volume`)
    }
    expect(screen.queryByTestId('30D')).not.toBeInTheDocument()
    expect(screen.queryByTestId('7D')).not.toBeInTheDocument()
  })

  it('uses day-based labels for explicitly supported week and month periods', () => {
    render(selectorTree([TimePeriod.DAY, TimePeriod.WEEK, TimePeriod.MONTH]))
    fireEvent.click(screen.getByTestId(TestID.TimeSelector))

    expect(screen.getByTestId('7D')).toHaveTextContent('7D volume')
    expect(screen.getByTestId('30D')).toHaveTextContent('30D volume')
    expect(screen.queryByTestId('1W')).not.toBeInTheDocument()
    expect(screen.queryByTestId('1M')).not.toBeInTheDocument()
  })

  it('uses a short label on narrow screens while retaining the supported dropdown options', () => {
    mockMediaSize('xs')
    render(selectorTree(LIVE_POOL_VOLUME_PERIODS))
    fireEvent.click(screen.getByRole('button', { name: 'Set month' }))

    expect(screen.getByTestId(TestID.TimeSelector)).toHaveTextContent(/^30D\s*$/)
    fireEvent.click(screen.getByTestId(TestID.TimeSelector))
    expect(screen.getByTestId('1D')).toHaveTextContent('1D volume')
    expect(screen.getByTestId('30D')).toHaveTextContent('30D volume')
    expect(screen.queryByTestId('7D')).not.toBeInTheDocument()
    expect(screen.queryByTestId('1H')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('1D'))

    expect(screen.getByTestId(TestID.TimeSelector)).toHaveTextContent(/^1D\s*$/)
    expect(screen.getByLabelText('Stored period')).toHaveTextContent(/^D$/)
  })

  it('preserves the existing default Solana clamp and hour/day options', () => {
    window.history.replaceState(null, '', '/explore/tokens/solana')
    render(selectorTree())
    fireEvent.click(screen.getByRole('button', { name: 'Set month' }))

    expect(screen.getByLabelText('Stored period')).toHaveTextContent(/^D$/)
    fireEvent.click(screen.getByTestId(TestID.TimeSelector))
    expect(screen.getByTestId('1H')).toHaveTextContent('1H volume')
    expect(screen.getByTestId('1D')).toHaveTextContent('1D volume')
    expect(screen.queryByTestId('1M')).not.toBeInTheDocument()
  })

  it('does not apply the legacy Solana store-writing clamp to explicit periods', () => {
    window.history.replaceState(null, '', '/explore/tokens/solana')
    render(selectorTree(LIVE_POOL_VOLUME_PERIODS))
    fireEvent.click(screen.getByRole('button', { name: 'Set month' }))

    expect(screen.getByLabelText('Stored period')).toHaveTextContent(/^M$/)
    expect(screen.getByTestId(TestID.TimeSelector)).toHaveTextContent('30D volume')
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })
})
