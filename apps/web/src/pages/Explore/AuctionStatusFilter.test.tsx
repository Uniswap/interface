import userEvent from '@testing-library/user-event'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  AuctionQuickFilter,
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { AuctionStatusFilter } from '~/pages/Explore/AuctionStatusFilter'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { render, screen, waitFor } from '~/test-utils/render'

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()),
  useMedia: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

function QuickFilterProbe(): JSX.Element {
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  const { setQuickFilter } = useExploreTablesFilterStoreActions()
  return (
    <>
      <output aria-label="Stored filter">{quickFilter}</output>
      <button onClick={() => setQuickFilter(AuctionQuickFilter.Verified)}>Pick verified</button>
    </>
  )
}

function renderStatusFilter(): void {
  render(
    <ExploreTablesFilterStoreContextProvider>
      <AuctionStatusFilter />
      <QuickFilterProbe />
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
    expect(options.map((item) => item.textContent)).toEqual(['All', 'Active', 'Launched'])
    // No pick yet: the store's default All is the checked radio.
    expect(options.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false'])
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

    await waitFor(() => expect(screen.getByLabelText('Stored filter')).toHaveTextContent(/^active$/))
    expect(trigger).toHaveAccessibleName('Active')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(UniswapEventName.AuctionFilterSelected, {
      filter: AuctionQuickFilter.Active,
    })
  })

  it('selects with Space and exposes only the selected option as checked', async () => {
    const user = userEvent.setup()
    renderStatusFilter()

    await user.tab()
    await user.keyboard(' {ArrowDown}{ArrowDown} ')

    await waitFor(() => expect(screen.getByLabelText('Stored filter')).toHaveTextContent(/^completed$/))
    const trigger = screen.getByRole('button', { name: 'Launched' })
    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(UniswapEventName.AuctionFilterSelected, {
      filter: AuctionQuickFilter.Completed,
    })

    await user.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitemradio', { checked: true })).toHaveTextContent(/^Launched$/)
    const unchecked = screen.getAllByRole('menuitemradio', { checked: false })
    expect(unchecked.map((item) => item.textContent)).toEqual(['All', 'Active'])
    // The visual check indicator stays in sync with aria-checked.
    const drawnChecks = screen.getAllByRole('menuitemradio').filter((item) => item.querySelector('svg'))
    expect(drawnChecks.map((item) => item.textContent)).toEqual(['Launched'])
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
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(3)
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
    expect(screen.getByLabelText('Stored filter')).toHaveTextContent(/^verified$/)
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('keeps the generic Status label for pill-only selections', async () => {
    const user = userEvent.setup()
    renderStatusFilter()

    await user.click(screen.getByRole('button', { name: 'Pick verified' }))
    const trigger = screen.getByRole('button', { name: 'Status' })
    await user.click(trigger)

    const options = screen.getAllByRole('menuitemradio')
    expect(options.filter((item) => item.getAttribute('aria-checked') === 'true')).toHaveLength(0)
    expect(options.filter((item) => item.querySelector('svg'))).toHaveLength(0)
  })
})
