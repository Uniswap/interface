import userEvent from '@testing-library/user-event'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { AuctionStatusFilter } from '~/pages/Explore/AuctionStatusFilter'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { render, screen, waitFor } from '~/test-utils/render'
import { AuctionQuickFilter, AuctionStatus } from '~/types/auctionFilters'

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()),
  useMedia: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

const ALL_LABELS = ['All', 'Active', 'Upcoming', 'Launched', 'Failed']

function StoreProbe(): JSX.Element {
  const statusFilter = useExploreTablesFilterStore((s) => s.statusFilter)
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  const { setQuickFilter } = useExploreTablesFilterStoreActions()
  return (
    <>
      <output aria-label="Stored status">{statusFilter}</output>
      <output aria-label="Stored quick filter">{quickFilter}</output>
      <button onClick={() => setQuickFilter(AuctionQuickFilter.Verified)}>Pick verified</button>
    </>
  )
}

function renderStatusFilter(): void {
  render(
    <ExploreTablesFilterStoreContextProvider>
      <AuctionStatusFilter />
      <StoreProbe />
    </ExploreTablesFilterStoreContextProvider>,
  )
}

describe('AuctionStatusFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMediaSize('xxxl')
  })

  it.each(['{Enter}', ' '])('opens with %s and returns focus to the trigger after Escape', async (key) => {
    const user = userEvent.setup()
    renderStatusFilter()
    const trigger = screen.getByRole('button', { name: 'Status' })

    await user.tab()
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard(key)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const options = screen.getAllByRole('menuitemradio')
    expect(options.map((item) => item.textContent)).toEqual(ALL_LABELS)
    // No pick yet: the store's default All is the checked radio.
    expect(options.map((item) => item.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
    ])
    await user.keyboard('{Escape}')

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    expect(trigger).toHaveFocus()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Pick verified' })).toHaveFocus()
  })

  it('selects a status with arrow keys and Enter, firing exactly one analytics event', async () => {
    const user = userEvent.setup()
    renderStatusFilter()
    const trigger = screen.getByRole('button', { name: 'Status' })

    await user.tab()
    await user.keyboard('{Enter}{ArrowDown}{Enter}')

    await waitFor(() => expect(screen.getByLabelText('Stored status')).toHaveTextContent(/^active$/))
    expect(trigger).toHaveAccessibleName('Active')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(UniswapEventName.AuctionFilterSelected, {
      filter: AuctionStatus.Active,
    })
  })

  it('selects with Space and exposes only the selected option as checked', async () => {
    const user = userEvent.setup()
    renderStatusFilter()

    await user.tab()
    await user.keyboard(' {ArrowDown}{ArrowDown} ')

    await waitFor(() => expect(screen.getByLabelText('Stored status')).toHaveTextContent(/^upcoming$/))
    const trigger = screen.getByRole('button', { name: 'Upcoming' })
    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(UniswapEventName.AuctionFilterSelected, {
      filter: AuctionStatus.Upcoming,
    })

    await user.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitemradio', { checked: true })).toHaveTextContent(/^Upcoming$/)
    const unchecked = screen.getAllByRole('menuitemradio', { checked: false })
    expect(unchecked.map((item) => item.textContent)).toEqual(['All', 'Active', 'Launched', 'Failed'])
    // The visual check indicator stays in sync with aria-checked.
    const drawnChecks = screen.getAllByRole('menuitemradio').filter((item) => item.querySelector('svg'))
    expect(drawnChecks.map((item) => item.textContent)).toEqual(['Upcoming'])
  })

  it('dismisses a pointer-opened menu with Escape and can reopen it from the keyboard', async () => {
    const user = userEvent.setup()
    renderStatusFilter()
    const trigger = screen.getByRole('button', { name: 'Status' })

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    await user.keyboard(' ')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(ALL_LABELS.length)
  })

  it('does not pull focus from an outside control when the pointer dismisses the menu', async () => {
    const user = userEvent.setup()
    renderStatusFilter()
    const trigger = screen.getByRole('button', { name: 'Status' })
    const outsideButton = screen.getByRole('button', { name: 'Pick verified' })

    await user.click(trigger)
    await user.click(outsideButton)

    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'))
    expect(outsideButton).toHaveFocus()
    expect(screen.getByLabelText('Stored quick filter')).toHaveTextContent(/^verified$/)
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('keeps the Status selection independent of the quick-filter pills', async () => {
    const user = userEvent.setup()
    renderStatusFilter()

    await user.click(screen.getByRole('button', { name: 'Pick verified' }))
    const trigger = screen.getByRole('button', { name: 'Status' })
    await user.click(trigger)

    expect(screen.getByRole('menuitemradio', { checked: true })).toHaveTextContent(/^All$/)
    expect(screen.getByLabelText('Stored quick filter')).toHaveTextContent(/^verified$/)
  })
})
