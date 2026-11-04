import {
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { AuctionQuickFilters } from '~/pages/Explore/AuctionQuickFilters'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

// Literals on purpose: these are the legal-reviewed copy and help article, not values to re-derive.
const VERIFIED_TOOLTIP =
  'Verified Launch means the launch has met certain objective, verifiable criteria. It is not an endorsement or recommendation.'
const VERIFIED_HELP_URL = 'https://support.uniswap.org/hc/en-us/articles/43107250032781'

function QuickFilterProbe(): JSX.Element {
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  return <span data-testid="quick-filter">{quickFilter}</span>
}

function renderQuickFilters(): void {
  render(
    <ExploreTablesFilterStoreContextProvider>
      <AuctionQuickFilters />
      <QuickFilterProbe />
    </ExploreTablesFilterStoreContextProvider>,
  )
}

describe('AuctionQuickFilters', () => {
  it('attaches the Verified definition and its help article to the Verified chip', async () => {
    renderQuickFilters()

    fireEvent.mouseEnter(screen.getByText('Verified'))

    await waitFor(() => expect(screen.getByText(VERIFIED_TOOLTIP)).toBeInTheDocument())
    expect(screen.getByText('Learn more').closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining(VERIFIED_HELP_URL),
    )
  })

  it('still selects the Verified filter when its tooltip is mounted', async () => {
    renderQuickFilters()

    const chip = screen.getByText('Verified')
    fireEvent.mouseEnter(chip)
    await waitFor(() => expect(screen.getByText(VERIFIED_TOOLTIP)).toBeInTheDocument())

    fireEvent.click(chip)

    await waitFor(() => expect(screen.getByTestId('quick-filter')).toHaveTextContent('verified'))
  })
})
