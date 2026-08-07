import type { PlainMessage } from '@bufbuild/protobuf'
import { LaunchesOrderBy, type Launch, type Launchpad } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { logger } from 'utilities/src/logger/logger'
import type { Mock } from 'vitest'
import { vi } from 'vitest'
import LaunchesPage from '~/pages/Launches'
import { useLaunches } from '~/pages/Launches/data/useLaunches'
import { useLaunchpads } from '~/pages/Launches/data/useLaunchpads'
import { LaunchFilterBar } from '~/pages/Launches/LaunchFilterBar'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen, within } from '~/test-utils/render'

// jsdom doesn't implement scrollIntoView, which the trending "View all" invokes synchronously.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

function renderLaunchesPage(): ReturnType<typeof render> {
  return render(<LaunchesPage />)
}

vi.mock('~/pages/Launches/data/useAuctionAddressByToken', () => ({
  useAuctionAddressByToken: (): ReadonlyMap<string, string> => new Map(),
}))
vi.mock('~/pages/Launches/data/useLaunches', () => ({
  useLaunches: vi.fn(),
}))
vi.mock('~/pages/Launches/data/useLaunchpads', () => ({
  useLaunchpads: vi.fn(),
}))
vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const mockUseLaunches = useLaunches as Mock
const mockUseLaunchpads = useLaunchpads as Mock

const LAUNCHPADS: PlainMessage<Launchpad>[] = [
  { id: 'noxa', name: 'Noxa', logoUrl: undefined, protocol: undefined },
  { id: 'flaunch', name: 'Flaunch', logoUrl: undefined, protocol: undefined },
  { id: 'pons', name: 'Pons', logoUrl: undefined, protocol: undefined },
  { id: 'clanker', name: 'Clanker', logoUrl: undefined, protocol: undefined },
  { id: 'zora', name: 'Zora', logoUrl: undefined, protocol: undefined },
]

function createLaunch({
  launchpadId,
  name,
  symbol,
  volume24hUsd,
  fdvUsd,
  chainId = UniverseChainId.Base,
}: {
  launchpadId: string
  name: string
  symbol: string
  volume24hUsd?: number
  fdvUsd?: number
  chainId?: UniverseChainId
}): PlainMessage<Launch> {
  return {
    launchpadId,
    token: {
      chainId,
      address: `0x000000000000000000000000000000000000000${symbol.length}`,
      symbol,
      name,
      logoUrl: undefined,
    },
    poolId: `0xpool-${symbol}`,
    hooksAddress: undefined,
    launchedAt: BigInt(Math.floor(Date.now() / 1000) - 300),
    graduated: undefined,
    stats: {
      volume24hUsd,
      tvlUsd: undefined,
      priceUsd: undefined,
      fdvUsd,
      priceChangePercent1h: undefined,
      priceChangePercent24h: undefined,
      sparkline: [],
    },
  }
}

function mockLaunchesResult(overrides: Partial<ReturnType<typeof useLaunches>> = {}): ReturnType<typeof useLaunches> {
  return {
    launches: [],
    lastPageLaunches: [],
    isLoading: false,
    isError: false,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    loadMore: vi.fn(),
    ...overrides,
  }
}

describe('LaunchesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLaunchpads.mockReturnValue({
      launchpads: LAUNCHPADS,
      launchpadById: new Map(LAUNCHPADS.map((launchpad) => [launchpad.id, launchpad])),
      isLoading: false,
      isError: false,
    })
  })

  it('renders every launchpad in trending (by volume) and every launch in the table', () => {
    mockUseLaunches.mockReturnValue(
      mockLaunchesResult({
        launches: [
          createLaunch({
            launchpadId: 'uniswap-cca',
            name: 'Moon Token',
            symbol: 'MOON',
            volume24hUsd: 12345,
            fdvUsd: 90000,
          }),
          createLaunch({ launchpadId: 'flaunch', name: 'Star Token', symbol: 'STAR', volume24hUsd: 500 }),
        ],
      }),
    )

    renderLaunchesPage()

    // Trending spans every launchpad, ordered by 24h volume (Moon > Star); the table lists every launch
    const trendingCards = screen.getAllByTestId(TestID.TrendingLaunchCard)
    expect(trendingCards).toHaveLength(2)
    expect(within(trendingCards[0]!).getByText('Moon Token')).toBeInTheDocument()
    expect(within(trendingCards[1]!).getByText('Star Token')).toBeInTheDocument()
    const rows = screen.getAllByTestId(TestID.LaunchTableRow)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByText('Moon Token')).toBeInTheDocument()
    expect(within(rows[1]!).getByText('Star Token')).toBeInTheDocument()
  })

  it('switches the table to the Trending category (server TRENDING ranking, table-paged) on View all', () => {
    mockUseLaunches.mockReturnValue(
      mockLaunchesResult({
        launches: [
          createLaunch({ launchpadId: 'noxa', name: 'Moon Token', symbol: 'MOON', volume24hUsd: 12345 }),
          createLaunch({ launchpadId: 'flaunch', name: 'Dust Token', symbol: 'DUST' }),
        ],
      }),
    )

    renderLaunchesPage()

    expect(screen.getAllByTestId(TestID.LaunchTableRow)).toHaveLength(2)

    mockUseLaunches.mockClear()
    fireEvent.click(screen.getByText('View all'))

    // The table request now carries the trending feed's params — the server TRENDING ranking, no
    // recency window — without the carousel's pageSize cap, i.e. normal table pagination.
    const tableCall = mockUseLaunches.mock.calls.find(
      ([params]) =>
        params?.sortBy === LaunchesOrderBy.TRENDING && params?.window === undefined && params?.pageSize === undefined,
    )
    expect(tableCall).toBeDefined()

    // The server owns admission under TRENDING, so the feed renders untouched — no client cutoff.
    const rows = screen.getAllByTestId(TestID.LaunchTableRow)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]!).getByText('Moon Token')).toBeInTheDocument()
  })

  it('renders the Trending feed untouched — admission is server-side, so no client cutoff or early-stop', () => {
    // Never resolves: the test only asserts whether load-more fires, and resolving would flip
    // the shared Table's loading state outside act().
    const loadMore = vi.fn(() => new Promise<void>(() => {}))
    const moon = createLaunch({ launchpadId: 'noxa', name: 'Moon Token', symbol: 'MOON', volume24hUsd: 12345 })
    const rest = [
      createLaunch({ launchpadId: 'flaunch', name: 'Dust Token', symbol: 'DUST' }),
      // Symbol length differs from DUST's so createLaunch derives a distinct address (and item id).
      createLaunch({ launchpadId: 'flaunch', name: 'Lint Token', symbol: 'LINTY' }),
    ]
    mockUseLaunches.mockReturnValue(
      mockLaunchesResult({
        launches: [moon, ...rest],
        lastPageLaunches: rest,
        hasNextPage: true,
        loadMore,
      }),
    )

    renderLaunchesPage()

    // Under All the server feed renders untouched and infinite scroll stays live (jsdom's short
    // viewport auto-triggers the shared Table's load-more when a next page is offered).
    expect(screen.getAllByTestId(TestID.LaunchTableRow)).toHaveLength(3)
    expect(loadMore).toHaveBeenCalled()

    fireEvent.click(screen.getByText('View all'))

    // Trending renders the same server feed: the gates ran server-side, so there is no zero-volume
    // padding left for the client to filter out (this rendered 1 row under the old cutoff), and
    // nothing suppresses the server's next page.
    expect(screen.getAllByTestId(TestID.LaunchTableRow)).toHaveLength(3)
  })

  it('previews the launchpad selection in the filter trigger', () => {
    mockUseLaunches.mockReturnValue(mockLaunchesResult())

    renderLaunchesPage()

    // The dropdown's hidden measuring copy always renders the option rows with live handlers, so
    // rows can be toggled without opening the menu (the open path is covered by the e2e suite).
    const toggleOption = (id: string): void => {
      fireEvent.click(screen.getAllByTestId(`${TestID.LaunchpadFilterOptionPrefix}${id}`)[0]!)
    }
    const trigger = (): HTMLElement => screen.getByTestId(TestID.LaunchpadFilterTrigger)

    const triggerLogo = (id: string): HTMLElement | null =>
      within(trigger()).queryByTestId(`${TestID.LaunchpadFilterTriggerLogoPrefix}${id}`)

    // Nothing selected: the all-launchpads label
    expect(within(trigger()).getByText('All launchpads')).toBeInTheDocument()

    // Single selection: that launchpad's name (with its logo) instead of the all label
    toggleOption('pons')
    expect(within(trigger()).getByText('Pons')).toBeInTheDocument()
    expect(within(trigger()).queryByText('All launchpads')).not.toBeInTheDocument()

    // Subset of several: an overlapping logo stack (accessible name = the selected launchpads)
    toggleOption('noxa')
    expect(triggerLogo('noxa')).toBeInTheDocument()
    expect(triggerLogo('pons')).toBeInTheDocument()
    expect(within(trigger()).getByLabelText('Noxa, Pons')).toBeInTheDocument()
    expect(within(trigger()).queryByText('All launchpads')).not.toBeInTheDocument()

    // Beyond the 3-logo cap the rest collapses into a +N bubble
    toggleOption('flaunch')
    toggleOption('clanker')
    expect(within(trigger()).getAllByTestId(new RegExp(`^${TestID.LaunchpadFilterTriggerLogoPrefix}`))).toHaveLength(3)
    expect(within(trigger()).getByText('+1')).toBeInTheDocument()

    // Every launchpad selected collapses back to the all label
    toggleOption('zora')
    expect(within(trigger()).getByText('All launchpads')).toBeInTheDocument()

    // The clear row resets to the all label
    toggleOption('pons')
    toggleOption('all')
    expect(within(trigger()).getByText('All launchpads')).toBeInTheDocument()
  })

  it('keeps the trigger reading as filtered while the launchpad registry has not resolved', () => {
    render(
      <LaunchFilterBar
        launchpadOptions={[]}
        networks={[UniverseChainId.Base]}
        selectedSources={new Set(['pons'])}
        networkChainId={undefined}
        onToggleSource={vi.fn()}
        onClearSources={vi.fn()}
        onSelectNetwork={vi.fn()}
      />,
    )

    // A selected id the registry can't resolve yet must not read "All launchpads" — the feed is
    // still filtered — so it falls into the stack's overflow bubble.
    const trigger = screen.getByTestId(TestID.LaunchpadFilterTrigger)
    expect(within(trigger).queryByText('All launchpads')).not.toBeInTheDocument()
    expect(within(trigger).getByText('+1')).toBeInTheDocument()
  })

  it('renders the loading skeleton without crashing', () => {
    // The shared Table renders its skeleton by invoking each column cell with an empty context, so
    // the launch cells must read values defensively (regression: cell.getValue is not a function).
    mockUseLaunches.mockReturnValue(mockLaunchesResult({ isLoading: true }))

    renderLaunchesPage()

    expect(screen.getAllByTestId('cell-loading-bubble').length).toBeGreaterThan(0)
  })

  it('renders no rows when the feed is empty', () => {
    mockUseLaunches.mockReturnValue(mockLaunchesResult())

    renderLaunchesPage()

    expect(screen.queryAllByTestId(TestID.LaunchTableRow)).toHaveLength(0)
    expect(screen.queryAllByTestId(TestID.TrendingLaunchCard)).toHaveLength(0)
  })

  it('hides the trending shelf when the trending request fails, leaving the table feed intact', () => {
    const moon = createLaunch({ launchpadId: 'noxa', name: 'Moon Token', symbol: 'MOON', volume24hUsd: 12345 })
    // Only the trending feed errors (e.g. a gateway timeout on the TRENDING sort); the table's
    // default VOLUME_1D feed is healthy.
    mockUseLaunches.mockImplementation((params?: { sortBy?: LaunchesOrderBy }) =>
      params?.sortBy === LaunchesOrderBy.TRENDING
        ? mockLaunchesResult({ isError: true, error: new Error('deadline exceeded') })
        : mockLaunchesResult({ launches: [moon] }),
    )

    renderLaunchesPage()

    // The failed request must not strand a skeleton or render a fake-empty shelf, and it must be
    // logged so the vanish stays distinguishable from a genuinely empty feed.
    expect(screen.queryAllByTestId(TestID.TrendingLaunchCard)).toHaveLength(0)
    expect(screen.queryByText('Trending launches')).not.toBeInTheDocument()
    expect(logger.error).toHaveBeenCalledWith(expect.any(Error), {
      tags: { file: 'Launches/index.tsx', function: 'trendingFeed' },
    })
    const rows = screen.getAllByTestId(TestID.LaunchTableRow)
    expect(rows).toHaveLength(1)
    expect(within(rows[0]!).getByText('Moon Token')).toBeInTheDocument()
  })

  it('keeps the retained trending rows up when a refetch fails, instead of blanking the carousel', () => {
    const moon = createLaunch({ launchpadId: 'noxa', name: 'Moon Token', symbol: 'MOON', volume24hUsd: 12345 })
    // A failed refetch: react-query keeps the last-good data alongside the error.
    mockUseLaunches.mockImplementation((params?: { sortBy?: LaunchesOrderBy }) =>
      params?.sortBy === LaunchesOrderBy.TRENDING
        ? mockLaunchesResult({ launches: [moon], isError: true, error: new Error('deadline exceeded') })
        : mockLaunchesResult(),
    )

    renderLaunchesPage()

    const trendingCards = screen.getAllByTestId(TestID.TrendingLaunchCard)
    expect(trendingCards).toHaveLength(1)
    expect(within(trendingCards[0]!).getByText('Moon Token')).toBeInTheDocument()
    expect(logger.error).toHaveBeenCalledWith(expect.any(Error), {
      tags: { file: 'Launches/index.tsx', function: 'trendingFeed' },
    })
  })

  it('logs a failed table request — an errored feed must not pass for an empty one', () => {
    const tableError = new Error('table deadline exceeded')
    // Only the table's feed errors (its request carries the page's default VOLUME_1D sort).
    mockUseLaunches.mockImplementation((params?: { sortBy?: LaunchesOrderBy }) =>
      params?.sortBy === LaunchesOrderBy.VOLUME_1D
        ? mockLaunchesResult({ isError: true, error: tableError })
        : mockLaunchesResult(),
    )

    renderLaunchesPage()

    expect(screen.queryAllByTestId(TestID.LaunchTableRow)).toHaveLength(0)
    expect(logger.error).toHaveBeenCalledWith(tableError, {
      tags: { file: 'Launches/index.tsx', function: 'tableFeed' },
    })
  })

  describe('pools.xyz promo gating', () => {
    beforeEach(() => {
      mockUseLaunches.mockReturnValue(mockLaunchesResult())
    })

    function mockPromoFlags({ banner, teaser }: { banner: boolean; teaser: boolean }): void {
      mocked(useFeatureFlag).mockImplementation((flag) => {
        if (flag === FeatureFlags.EnablePoolsXyzBanner) {
          return banner
        }
        if (flag === FeatureFlags.EnablePoolsXyzTeaser) {
          return teaser
        }
        return false
      })
    }

    it('scopes the hero marquee to CCA Robinhood Chain rows even when the feed leaks others', () => {
      mockPromoFlags({ banner: true, teaser: false })
      const quick = createLaunch({
        launchpadId: 'uniswap-cca',
        name: 'Quick Token',
        symbol: 'QUICK',
        chainId: UniverseChainId.Robinhood,
      })
      // A row from another launchpad on the right chain (a feed that ignored the launchpad_id
      // param) and a CCA row on the wrong chain — neither belongs in the hero.
      const leaked = createLaunch({
        launchpadId: 'flaunch',
        name: 'Leak Token',
        symbol: 'LEAK',
        chainId: UniverseChainId.Robinhood,
      })
      const offChain = createLaunch({ launchpadId: 'uniswap-cca', name: 'Base Token', symbol: 'BSE' })
      mockUseLaunches.mockImplementation((params?: { launchpadId?: string }) =>
        params?.launchpadId === 'uniswap-cca'
          ? mockLaunchesResult({ launches: [quick, leaked, offChain] })
          : mockLaunchesResult(),
      )

      renderLaunchesPage()

      // The pill strip is rendered twice for the seamless loop, so the one admitted row shows twice.
      const hero = screen.getByTestId(TestID.LaunchesHero)
      expect(within(hero).getAllByText('Quick Token')).toHaveLength(2)
      expect(within(hero).queryByText('Leak Token')).not.toBeInTheDocument()
      expect(within(hero).queryByText('Base Token')).not.toBeInTheDocument()
    })

    it('renders the hero when the banner flag is on', () => {
      mockPromoFlags({ banner: true, teaser: false })

      renderLaunchesPage()

      expect(screen.getByTestId(TestID.LaunchesHero)).toBeInTheDocument()
      expect(screen.queryByTestId(TestID.LaunchesTeaserBanner)).not.toBeInTheDocument()
    })

    it('lets the banner win over the teaser when both flags are on', () => {
      mockPromoFlags({ banner: true, teaser: true })

      renderLaunchesPage()

      expect(screen.getByTestId(TestID.LaunchesHero)).toBeInTheDocument()
      expect(screen.queryByTestId(TestID.LaunchesTeaserBanner)).not.toBeInTheDocument()
    })

    it('renders the teaser when only the teaser flag is on', () => {
      mockPromoFlags({ banner: false, teaser: true })

      renderLaunchesPage()

      expect(screen.getByTestId(TestID.LaunchesTeaserBanner)).toBeInTheDocument()
      expect(screen.queryByTestId(TestID.LaunchesHero)).not.toBeInTheDocument()
    })

    it('renders neither promo when both flags are off', () => {
      mockPromoFlags({ banner: false, teaser: false })

      renderLaunchesPage()

      expect(screen.queryByTestId(TestID.LaunchesHero)).not.toBeInTheDocument()
      expect(screen.queryByTestId(TestID.LaunchesTeaserBanner)).not.toBeInTheDocument()
    })
  })
})
