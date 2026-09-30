import type { PlainMessage } from '@bufbuild/protobuf'
import { LaunchesOrderBy, type Launch, type Launchpad } from '@uniswap/client-launches/dist/launches/v1/types_pb'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { TestID } from '@universe/test'
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
  // Defaults to a symbol-derived address; pass it explicitly when a case needs many launches to stay
  // distinct, since `LaunchItem.id` is built from the address and same-length symbols would collide.
  address = `0x000000000000000000000000000000000000000${symbol.length}`,
}: {
  launchpadId: string
  name: string
  symbol: string
  volume24hUsd?: number
  fdvUsd?: number
  chainId?: UniverseChainId
  address?: string
}): PlainMessage<Launch> {
  return {
    launchpadId,
    token: {
      chainId,
      address,
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
    recentTrades: [],
    badges: [],
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

    function mockPromoFlags({
      banner,
      teaser,
      arc = false,
    }: {
      banner: boolean
      teaser: boolean
      arc?: boolean
    }): void {
      mocked(useFeatureFlag).mockImplementation((flag) => {
        if (flag === FeatureFlags.EnablePoolsXyzBanner) {
          return banner
        }
        if (flag === FeatureFlags.EnablePoolsXyzTeaser) {
          return teaser
        }
        if (flag === FeatureFlags.Arc) {
          return arc
        }
        return false
      })
    }

    /** The hero's request is the only one naming the `pools` group, so that's what identifies it. */
    function findHeroCall(): Record<string, unknown> | undefined {
      return mockUseLaunches.mock.calls.find(([params]) => params?.launchpadIds?.includes('pools'))?.[0]
    }

    it('requests the hero feed with the same params as the Pools Trending tab', () => {
      mockPromoFlags({ banner: true, teaser: false })

      renderLaunchesPage()

      // Literals on purpose: asserting the request against the constants it is built from can't
      // catch drift away from the Trending tab's shape, which is the whole point of this feed.
      expect(findHeroCall()).toMatchObject({
        launchpadIds: ['pools'],
        chainIds: [UniverseChainId.Robinhood],
        sortBy: LaunchesOrderBy.TRENDING,
        pageSize: 100,
      })
      // The single-launchpad param is what scoped this feed to CCA-only and starved it.
      expect(findHeroCall()?.launchpadId).toBeUndefined()
    })

    it('widens the hero feed to Arc alongside Robinhood when the Arc flag is on', () => {
      mockPromoFlags({ banner: true, teaser: false, arc: true })

      renderLaunchesPage()

      expect(findHeroCall()).toMatchObject({
        launchpadIds: ['pools'],
        chainIds: [UniverseChainId.Robinhood, UniverseChainId.Arc],
        sortBy: LaunchesOrderBy.TRENDING,
        pageSize: 100,
      })
    })

    it('admits both Pools launch mechanisms into the hero marquee, and no other launchpad', () => {
      mockPromoFlags({ banner: true, teaser: false })
      const crowd = createLaunch({
        launchpadId: 'uniswap-cca',
        name: 'Quick Token',
        symbol: 'QUICK',
        chainId: UniverseChainId.Robinhood,
      })
      // Instant launches ride the same `pools` group and belong in the marquee too — scoping the
      // hero to CCA alone is what this feed's params moved away from.
      const instant = createLaunch({
        launchpadId: 'uniswap-bonding-curve',
        name: 'Curve Token',
        symbol: 'CURVEY',
        chainId: UniverseChainId.Robinhood,
      })
      // A launchpad outside the Uniswap brand: what a data-api that doesn't recognise the `pools`
      // group id would serve. It must not reach a Uniswap-branded marquee.
      const leaked = createLaunch({
        launchpadId: 'flaunch',
        name: 'Leak Token',
        symbol: 'LEAK',
        chainId: UniverseChainId.Robinhood,
      })
      mockUseLaunches.mockImplementation((params?: { launchpadIds?: string[] }) =>
        params?.launchpadIds?.includes('pools')
          ? mockLaunchesResult({ launches: [crowd, instant, leaked] })
          : mockLaunchesResult(),
      )

      renderLaunchesPage()

      // The pill strip is rendered twice for the seamless loop, so each admitted row shows twice.
      const hero = screen.getByTestId(TestID.LaunchesHero)
      expect(within(hero).getAllByText('Quick Token')).toHaveLength(2)
      expect(within(hero).getAllByText('Curve Token')).toHaveLength(2)
      expect(within(hero).queryByText('Leak Token')).not.toBeInTheDocument()
    })

    /** `count` Robinhood-chain Pools launches, each distinct so none is de-duplicated away. */
    function createHeroFeed(count: number): PlainMessage<Launch>[] {
      return Array.from({ length: count }, (_, index) =>
        createLaunch({
          launchpadId: 'uniswap-cca',
          name: `Hero Token ${index}`,
          symbol: `HERO${index}`,
          chainId: UniverseChainId.Robinhood,
          address: `0x${String(index).padStart(40, '0')}`,
        }),
      )
    }

    function mockHeroFeed(launches: PlainMessage<Launch>[]): void {
      mockUseLaunches.mockImplementation((params?: { launchpadIds?: string[] }) =>
        params?.launchpadIds?.includes('pools') ? mockLaunchesResult({ launches }) : mockLaunchesResult(),
      )
    }

    it('links each pill to its token page on Pools and the rest of the card to pools.xyz', () => {
      mockPromoFlags({ banner: true, teaser: false })
      mockHeroFeed([
        createLaunch({
          launchpadId: 'uniswap-cca',
          name: 'Quick Token',
          symbol: 'QUICK',
          chainId: UniverseChainId.Robinhood,
          address: '0x00000000000000000000000000000000000000aa',
        }),
      ])

      renderLaunchesPage()

      const hero = screen.getByTestId(TestID.LaunchesHero)
      // The stretched card link comes first in the tab order, before any pill.
      const [cardLink, pill] = within(hero).getAllByRole('link')
      expect(cardLink).toHaveAttribute('href', 'https://pools.xyz')
      expect(pill).toHaveTextContent('Quick Token')
      expect(pill).toHaveAttribute('href', 'https://pools.xyz/t/robinhood/0x00000000000000000000000000000000000000aa')
      expect(pill).toHaveAttribute('target', '_blank')
      expect(pill).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('keeps the arrow button decorative: hidden from assistive tech and out of the tab order', () => {
      mockPromoFlags({ banner: true, teaser: false })

      renderLaunchesPage()

      // The stretched card link already carries the name and the tab stop; a second control would
      // read as a duplicate link to pools.xyz.
      const hero = screen.getByTestId(TestID.LaunchesHero)
      const arrow = hero.querySelector('button')
      expect(arrow).toHaveAttribute('aria-hidden', 'true')
      expect(arrow).toHaveAttribute('tabindex', '-1')
      expect(within(hero).queryByRole('button')).not.toBeInTheDocument()
    })

    it('hides the loop clones from assistive tech and the tab order', () => {
      mockPromoFlags({ banner: true, teaser: false })
      mockHeroFeed(createHeroFeed(3))

      renderLaunchesPage()

      const hero = screen.getByTestId(TestID.LaunchesHero)
      // Six pills render (two copies of three), but only the first copy is exposed as links.
      expect(within(hero).getAllByText(/^Hero Token \d+$/)).toHaveLength(6)
      expect(within(hero).getAllByRole('link', { name: /Hero Token/ })).toHaveLength(3)
      const clones = hero.querySelectorAll('[aria-hidden="true"] a')
      expect(clones).toHaveLength(3)
      clones.forEach((clone) => expect(clone).toHaveAttribute('tabindex', '-1'))
    })

    it('caps the marquee strip at 20 pills however many launches the feed serves', () => {
      mockPromoFlags({ banner: true, teaser: false })
      // Well past the cap, and past what the request's page size would let through unclamped.
      mockHeroFeed(createHeroFeed(60))

      renderLaunchesPage()

      const hero = screen.getByTestId(TestID.LaunchesHero)
      // Each pill in the capped strip renders twice — the strip is doubled for the seamless loop —
      // so 20 distinct pills is 40 elements, and the cap holds the first 20 the feed ordered.
      expect(within(hero).getAllByText(/^Hero Token \d+$/)).toHaveLength(40)
      expect(within(hero).getAllByText('Hero Token 19')).toHaveLength(2)
      expect(within(hero).queryByText('Hero Token 20')).not.toBeInTheDocument()
    })

    it('derives the marquee duration from the measured strip at 53 px/s', () => {
      mockPromoFlags({ banner: true, teaser: false })
      mockHeroFeed(createHeroFeed(3))
      // jsdom lays nothing out, so stand in for the doubled strip's rendered width.
      const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(2120)

      try {
        renderLaunchesPage()

        // One copy of the strip is half the measured 2120px; 1060px / 53 px/s. Literal on purpose.
        const hero = screen.getByTestId(TestID.LaunchesHero)
        const strip = hero.querySelector('.launches-quick-strip')
        // Inline attribute rather than toHaveStyle: jsdom's computed style doesn't carry animation props.
        expect(strip).toHaveAttribute('style', 'animation-duration: 20s;')
      } finally {
        offsetWidth.mockRestore()
      }
    })

    it('hides the loop clone of the strip from assistive tech', () => {
      mockPromoFlags({ banner: true, teaser: false })
      mockHeroFeed(createHeroFeed(3))

      renderLaunchesPage()

      // Six pills render (two copies of three); the second copy is presentation only.
      const hero = screen.getByTestId(TestID.LaunchesHero)
      expect(within(hero).getAllByText(/^Hero Token \d+$/)).toHaveLength(6)
      const clone = hero.querySelector('.launches-quick-marquee [aria-hidden="true"]')
      expect(clone).toHaveTextContent('Hero Token 0')
      expect(within(clone as HTMLElement).getAllByText(/^Hero Token \d+$/)).toHaveLength(3)
    })

    it('renders every pill when the feed is shorter than the cap', () => {
      mockPromoFlags({ banner: true, teaser: false })
      mockHeroFeed(createHeroFeed(3))

      renderLaunchesPage()

      // A short feed must not be trimmed — the cap is an upper bound, not a fixed strip length.
      const hero = screen.getByTestId(TestID.LaunchesHero)
      expect(within(hero).getAllByText(/^Hero Token \d+$/)).toHaveLength(6)
      expect(within(hero).getAllByText('Hero Token 0')).toHaveLength(2)
      expect(within(hero).getAllByText('Hero Token 2')).toHaveLength(2)
    })

    it('pairs Arc with Robinhood in the lockup and the copy when the Arc flag is on', () => {
      mockPromoFlags({ banner: true, teaser: false, arc: true })

      renderLaunchesPage()

      const hero = screen.getByTestId(TestID.LaunchesHero)
      expect(within(hero).getByText(/Trade new Arc and Robinhood Chain tokens on/)).toBeInTheDocument()
      // Two tiles, Arc layered bottom-right; the mask is what knocks the 1.5px halo out of the
      // Robinhood tile, so its cut-out is Arc's 28px rect inflated by 1.5px on every side.
      const lockup = within(hero).getByTestId(TestID.LaunchesHeroNetworkLockup)
      expect(lockup.querySelectorAll('rect[width="28"]')).toHaveLength(2)
      const halo = lockup.querySelector('mask rect[fill="black"]')
      expect(halo).toHaveAttribute('x', '16.5')
      expect(halo).toHaveAttribute('y', '16.5')
      expect(halo).toHaveAttribute('width', '31')
      expect(halo).toHaveAttribute('rx', '8.5')
      expect(lockup.querySelector('g[mask]')).toHaveAttribute('mask', `url(#${lockup.querySelector('mask')?.id})`)
    })

    it('keeps a single Robinhood tile and Robinhood-only copy while the Arc flag is off', () => {
      mockPromoFlags({ banner: true, teaser: false, arc: false })

      renderLaunchesPage()

      const hero = screen.getByTestId(TestID.LaunchesHero)
      expect(within(hero).getByText(/Trade new Robinhood Chain tokens on/)).toBeInTheDocument()
      expect(within(hero).queryByText(/Arc/)).not.toBeInTheDocument()
      const lockup = within(hero).getByTestId(TestID.LaunchesHeroNetworkLockup)
      expect(lockup.querySelectorAll('rect')).toHaveLength(1)
      expect(lockup.querySelector('rect')).toHaveAttribute('width', '48')
      expect(lockup.querySelector('mask')).toBeNull()
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
