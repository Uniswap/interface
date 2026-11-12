import { type InfiniteData, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { Route, Routes, useSearchParams } from 'react-router'
import { getHookRegistryKey, useHookRegistryMap } from 'uniswap/src/features/poolHooks/hooks/useHookRegistryMap'
import { useUniswapHookProvenance } from 'uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { OrderDirection } from '~/data/util'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { HOOK_FIXTURES, HOOK_LIST_SUMMARY_FIXTURE } from '~/features/Hooks/fixtures'
import { EMPTY_HOOK_FILTER_STATE } from '~/features/Hooks/hookFilters'
import { DEFAULT_HOOK_LIST_OPTIONS } from '~/features/Hooks/hookListOptions'
import { hookListInfiniteQueryOptions, hookListSummaryQueryOptions } from '~/features/Hooks/queries'
import { type Hook, type HookListPage, HooksFixtureScenario, HookSortField } from '~/features/Hooks/types'
import HooksPage from '~/pages/Explore/HooksPage'
import { act, fireEvent, render, screen, waitFor, within } from '~/test-utils/render'

const { sendEvent } = vi.hoisted(() => ({
  sendEvent: vi.fn<(event: string, properties: Record<string, unknown>) => void>(),
}))

// The app-wide setup replaces telemetry with pass-through mocks; these tests exercise real Table, Modal and Trace.
vi.unmock('uniswap/src/features/telemetry/Trace')
vi.unmock('uniswap/src/components/modals/Modal')
vi.mock('@react-navigation/core', () => ({ useFocusEffect: vi.fn() }))
vi.mock('@uniswap/analytics-events', () => ({
  SharedEventName: { PAGE_VIEWED: 'Page Viewed', ELEMENT_CLICKED: 'Element Clicked' },
  BrowserEvent: { onClick: 'onClick', onFocus: 'onFocus', onKeyPress: 'onKeyPress' },
  sendAnalyticsEvent: vi.fn(),
  trace: vi.fn(),
}))
vi.mock('utilities/src/telemetry/analytics/analytics', async (importOriginal) => {
  const original = await importOriginal<typeof import('utilities/src/telemetry/analytics/analytics')>()
  return { ...original, analytics: { ...original.analytics, sendEvent } }
})
vi.mock('~/features/Hooks/queries', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/features/Hooks/queries')>()
  return {
    ...original,
    hookListInfiniteQueryOptions: vi.fn(original.hookListInfiniteQueryOptions),
    hookListSummaryQueryOptions: vi.fn(original.hookListSummaryQueryOptions),
  }
})
vi.mock('uniswap/src/features/poolHooks/hooks/useHookRegistryMap', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/poolHooks/hooks/useHookRegistryMap')>()),
  useHookRegistryMap: vi.fn(),
}))
vi.mock('uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/poolHooks/hooks/useUniswapHookProvenance')>()),
  useUniswapHookProvenance: vi.fn(),
}))
vi.mock('uniswap/src/features/language/LocalizationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/language/LocalizationContext')>()),
  useLocalizationContext: () => ({
    convertFiatAmountFormatted: (value: number) => (value === 0 ? '$0.00' : `USD ${value}`),
  }),
}))

vi.mock('nuqs/adapters/react-router/v7', () => ({
  useOptimisticSearchParams: () => {
    const [searchParams] = useSearchParams()
    return searchParams
  },
}))

let queryClient: QueryClient
let originalListOptions: typeof hookListInfiniteQueryOptions
let originalSummaryOptions: typeof hookListSummaryQueryOptions
const OPEN_HELP_SELECTOR = '[data-slot="tooltip-compat-popup"][data-open]'

function tapHelp(target: HTMLElement): void {
  for (const type of ['pointerdown', 'pointerup'] as const) {
    const event = new Event(type, { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'pointerType', { value: 'touch' })
    fireEvent(target, event)
  }
  fireEvent.click(target)
}

function fixture(id: string): Hook {
  const hook = HOOK_FIXTURES.find((candidate) => candidate.id === id)
  if (!hook) {
    throw new Error(`Missing Hooks test fixture ${id}`)
  }
  return hook
}

function page(
  hooks: readonly Hook[],
  nextCursor: string | null = null,
  options: HookListPage['options'] = { ...DEFAULT_HOOK_LIST_OPTIONS, chainId: undefined },
): HookListPage {
  return { hooks, nextCursor, options }
}

function seedHooks(hooks: readonly Hook[], chainId?: UniverseChainId): void {
  const options = originalListOptions({ pageSize: 100, chainId })
  queryClient.setQueryData(options.queryKey, {
    pages: [page(hooks, null, options.queryKey[3])],
    pageParams: [''],
  })
}

function mockPages(
  fetchPage: (
    cursor: string,
    options: Parameters<typeof hookListInfiniteQueryOptions>[0],
  ) => HookListPage | Promise<HookListPage>,
): void {
  vi.mocked(hookListInfiniteQueryOptions).mockImplementation((options) => {
    const queryOptions = originalListOptions(options)
    return {
      ...queryOptions,
      queryFn: async ({ pageParam }) => ({
        ...(await fetchPage(pageParam, options)),
        options: queryOptions.queryKey[3],
      }),
    }
  })
}

function renderPreview(url = '/explore/hooks'): ReturnType<typeof render> {
  window.history.replaceState(null, '', url)
  return render(
    <QueryClientProvider client={queryClient}>
      <ExploreTablesFilterStoreContextProvider>
        <Routes>
          <Route path="/explore/hooks/:chainName/:hookAddress" element={<>Hook detail destination</>} />
          <Route path="/explore/hooks/:chainName?" element={<HooksPage />} />
        </Routes>
      </ExploreTablesFilterStoreContextProvider>
    </QueryClientProvider>,
  )
}

async function changeSearch(input: HTMLElement, value: string): Promise<void> {
  vi.useFakeTimers()
  try {
    fireEvent.change(input, { target: { value } })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
  } finally {
    vi.useRealTimers()
  }
}

function scrollToNextPage(): void {
  vi.spyOn(window, 'scrollY', 'get').mockReturnValue(10_000)
  fireEvent.scroll(window)
}

function row(id: string): HTMLElement {
  return screen.getByTestId(`${TestID.HookListRow}-${id}`)
}

function rowIds(): string[] {
  return screen
    .getAllByTestId(new RegExp(`^${TestID.HookListRow}-`))
    .map((element) => element.dataset.testid?.replace(`${TestID.HookListRow}-`, '') ?? '')
}

function rowClicks(): Record<string, unknown>[] {
  return sendEvent.mock.calls
    .filter(([event, properties]) => event === 'Element Clicked' && properties.element === 'hook_list_row')
    .map(([, properties]) => properties)
}

describe('Hooks preview', () => {
  beforeAll(async () => {
    const queries = await vi.importActual<typeof import('~/features/Hooks/queries')>('~/features/Hooks/queries')
    originalListOptions = queries.hookListInfiniteQueryOptions
    originalSummaryOptions = queries.hookListSummaryQueryOptions
  })

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
    vi.mocked(hookListInfiniteQueryOptions).mockImplementation(originalListOptions)
    vi.mocked(hookListSummaryQueryOptions).mockImplementation(originalSummaryOptions)
    vi.mocked(useHookRegistryMap).mockReturnValue(undefined)
    vi.mocked(useUniswapHookProvenance).mockReturnValue(() => undefined)
    // jsdom has no layout; prevent the real Table from treating every page as shorter than the viewport.
    vi.spyOn(document.body, 'scrollHeight', 'get').mockReturnValue(10_000)
  })

  afterEach(() => {
    queryClient.clear()
    vi.restoreAllMocks()
  })

  it.each([
    { id: 'lt-100k', tvlRange: { max: 100_000 } },
    { id: '100k-1m', tvlRange: { min: 100_000, max: 1_000_000 } },
    { id: 'gt-10m', tvlRange: { min: 10_000_000 } },
  ])('passes the $id bucket as a USD range while retaining its URL identity', async ({ id, tvlRange }) => {
    renderPreview(`/explore/hooks?hookTvl=${id}`)
    const queryKey = originalListOptions({ pageSize: 100, tvlRange }).queryKey

    await waitFor(() => expect(queryClient.getQueryState(queryKey)?.status).toBe('success'))

    expect(vi.mocked(hookListInfiniteQueryOptions).mock.lastCall?.[0]?.tvlRange).toEqual(tvlRange)
    expect(vi.mocked(hookListInfiniteQueryOptions).mock.lastCall?.[0]?.filters).toEqual({
      routedOnly: false,
      verifiedSourceOnly: false,
      metadataOnly: false,
    })
    expect(new URLSearchParams(window.location.search).get('hookTvl')).toBe(id)
  })

  it('exposes native identity and metric links without preview notes or nested interactive elements', async () => {
    renderPreview(
      '/explore/hooks?featureFlagOverride=hooks_explore_ux&lng=en-US&chain=base&entryPoint=portfolio&hookReferrer=badge&hooksFixtureScenario=default&unrelated=drop',
    )

    const identity = await screen.findByRole('link', { name: /Angstrom on Ethereum, Base/ })
    await waitFor(() => expect(document.title).toBe('Explore hooks on Uniswap'))
    expect(screen.queryByText('Preview · Sample data')).not.toBeInTheDocument()
    const angstrom = row('hk_7b8a2e')
    expect(angstrom.tagName).not.toBe('A')
    expect(angstrom.querySelector('a a, a button')).toBeNull()
    const links = within(angstrom).getAllByRole('link')
    expect(links).toHaveLength(4)
    const destination = new URL(identity.getAttribute('href') ?? '', window.location.origin)
    expect(destination.pathname).toBe('/explore/hooks/ethereum/0x1111111111111111111111111111111111111111')
    expect([...destination.searchParams]).toEqual([
      ['hookReferrer', 'list'],
      ['featureFlagOverride', 'hooks_explore_ux'],
      ['lng', 'en-US'],
    ])
    for (const link of links) {
      expect(link).toHaveAttribute('href', identity.getAttribute('href'))
      expect(link.tabIndex).toBe(link === identity ? 0 : -1)
    }
    identity.focus()
    expect(identity).toHaveFocus()
    expect(screen.queryByRole('button', { name: /create|add liquidity/i })).not.toBeInTheDocument()
    expect(useHookRegistryMap).toHaveBeenLastCalledWith({ chainId: undefined, enabled: false })
  })

  it('keeps authoritative summaries unchanged while loading additional pages and deduplicates opaque group IDs', async () => {
    const angstrom = fixture('hk_7b8a2e')
    const stable = fixture('hk_c51e09')
    const configured = fixture('hk_86a4c3')
    const fetchPage = vi.fn((cursor: string) =>
      cursor
        ? page([{ ...angstrom, name: 'Duplicate must not replace the first row' }, configured])
        : page([angstrom, stable], 'opaque-next-cursor'),
    )
    mockPages(fetchPage)
    renderPreview()

    expect(await screen.findByText('Angstrom')).toBeInTheDocument()
    const summary = screen.getByTestId(TestID.HooksSummary)
    const summaryText = summary.textContent
    expect(within(summary).getByText('7')).toBeInTheDocument()
    expect(within(summary).getByText('USD 4300640000')).toBeInTheDocument()
    expect(within(summary).getByText('USD 990260000')).toBeInTheDocument()
    scrollToNextPage()

    expect(await screen.findByText('Configured hook preview')).toBeInTheDocument()
    expect(screen.getAllByTestId(new RegExp(`^${TestID.HookListRow}-`))).toHaveLength(3)
    expect(screen.getAllByText('Angstrom')).toHaveLength(1)
    expect(screen.queryByText('Duplicate must not replace the first row')).not.toBeInTheDocument()
    expect(summary.textContent).toBe(summaryText)
    expect(fetchPage).toHaveBeenNthCalledWith(2, 'opaque-next-cursor', {
      scenario: HooksFixtureScenario.Default,
      chainId: undefined,
      pageSize: 100,
      search: '',
      sortField: HookSortField.Volume,
      sortDirection: OrderDirection.Desc,
      period: '1d',
      filters: { routedOnly: false, verifiedSourceOnly: false, metadataOnly: false },
      tvlRange: undefined,
    })
    expect(screen.queryByRole('button', { name: 'Load more hooks' })).not.toBeInTheDocument()
  })

  it('distinguishes numeric zero, unavailable metrics, custom-accounting volume and partial indexing', async () => {
    seedHooks([fixture('hk_f03d72'), fixture('hk_2d15bf'), fixture('hk_a93c10'), fixture('hk_53d1ca')])
    renderPreview()

    const zero = within(await screen.findByTestId(`${TestID.HookListRow}-hk_f03d72`))
    expect(zero.getByText('0')).toBeInTheDocument()
    expect(zero.getAllByText('$0.00')).toHaveLength(2)
    const unavailable = within(row('hk_2d15bf'))
    expect(unavailable.getAllByText('Unavailable')).toHaveLength(2)
    expect(unavailable.queryByText('$0.00')).not.toBeInTheDocument()
    const custom = within(row('hk_a93c10'))
    expect(custom.getByRole('button', { name: 'Custom Accounting hook' })).toBeInTheDocument()
    expect(custom.queryByText('USD 2800000')).not.toBeInTheDocument()
    expect(custom.getByText('18')).toBeInTheDocument()
    expect(custom.getByRole('link', { name: 'Custom Accounting hook' })).toHaveAttribute('tabindex', '-1')
    const partial = within(row('hk_53d1ca'))
    expect(partial.getByText('Some metrics are unavailable while this hook is being indexed.')).toBeInTheDocument()
    expect(partial.getByText('USD 1240000')).toBeInTheDocument()
  })

  it('uses the scoped network destination, metrics and network identity instead of multichain aggregates', async () => {
    renderPreview('/explore/hooks/base')

    const identity = await screen.findByRole('link', { name: 'Angstrom on Base' })
    expect(identity).toHaveAttribute(
      'href',
      '/explore/hooks/base/0x2222222222222222222222222222222222222222?hookReferrer=list',
    )
    const angstrom = within(row('hk_7b8a2e'))
    expect(angstrom.getByText('12')).toBeInTheDocument()
    expect(angstrom.getByText('USD 4100000')).toBeInTheDocument()
    expect(angstrom.getByText('USD 10500000')).toBeInTheDocument()
    expect(angstrom.queryByText('USD 14200000')).not.toBeInTheDocument()
    expect(screen.queryByTestId(`${TestID.HookListRow}-hk_c51e09`)).not.toBeInTheDocument()
    const summary = within(screen.getByTestId(TestID.HooksSummary))
    expect(summary.getByText('7')).toBeInTheDocument()
    expect(summary.getByText('USD 4300640000')).toBeInTheDocument()
    expect(summary.getByText('USD 990260000')).toBeInTheDocument()
  })

  it('resets pagination for debounced name search, no matches and a clear back to the first page', async () => {
    const user = userEvent.setup()
    renderPreview('/explore/hooks?featureFlagOverride=hooks_explore_ux&lng=en-US')
    await screen.findByText('Angstrom')
    scrollToNextPage()
    await waitFor(() => expect(rowIds()).toHaveLength(7))
    const search = screen.getByRole('textbox', { name: 'Search hooks by name or address' })

    await changeSearch(search, '  sTaBlE  ')

    await waitFor(() => expect(rowIds()).toEqual(['hk_c51e09']))
    expect(new URLSearchParams(window.location.search).get('hookSearch')).toBe('sTaBlE')
    const searched = queryClient.getQueryData<InfiniteData<HookListPage>>(
      originalListOptions({ pageSize: 100, search: 'stable' }).queryKey,
    )
    expect(searched).toMatchObject({
      pageParams: [''],
      pages: [{ hooks: [{ id: 'hk_c51e09' }], nextCursor: null }],
    })
    await changeSearch(search, 'no matching hook')

    expect(await screen.findByText('No hooks found')).toBeInTheDocument()
    expect(screen.queryByTestId(`${TestID.HookListRow}-hk_c51e09`)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear' }))

    await screen.findByText('Angstrom')
    expect(rowIds()).toHaveLength(7)
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
    expect(new URLSearchParams(window.location.search).get('hookSearch')).toBeNull()
    expect(new URLSearchParams(window.location.search).get('featureFlagOverride')).toBe('hooks_explore_ux')
    expect(new URLSearchParams(window.location.search).get('lng')).toBe('en-US')
    expect(
      queryClient.getQueryData<InfiniteData<HookListPage>>(originalListOptions({ pageSize: 100 }).queryKey)?.pageParams,
    ).toEqual([''])
  })

  it.each(['network', 'search', 'period'] as const)(
    'keeps resolved rows, links and summary visible during a pending %s change',
    async (change) => {
      const user = userEvent.setup()
      const angstrom = fixture('hk_7b8a2e')
      const baseDeployment = angstrom.deployments[1]!
      const previousHook: Hook =
        change === 'network'
          ? { ...angstrom, deployments: [baseDeployment], metrics: baseDeployment.metrics }
          : angstrom
      let resolveNext: (value: HookListPage) => void = () => {
        throw new Error('The replacement request has not started')
      }
      const nextRequest = new Promise<HookListPage>((resolve) => {
        resolveNext = resolve
      })
      let pending = false
      mockPages(async () => (pending ? nextRequest : page([previousHook])))
      const fetchSummary = vi.fn(() => HOOK_LIST_SUMMARY_FIXTURE)
      vi.mocked(hookListSummaryQueryOptions).mockImplementation((options) => ({
        ...originalSummaryOptions(options),
        queryFn: fetchSummary,
      }))
      renderPreview(change === 'network' ? '/explore/hooks/base' : '/explore/hooks')
      const identity = await screen.findByRole('link', { name: /Angstrom on/ })
      const previousRow = row('hk_7b8a2e')
      const previousText = previousRow.textContent
      const previousHref = identity.getAttribute('href')
      const summary = screen.getByTestId(TestID.HooksSummary)
      await within(summary).findByText('USD 4300640000')
      const summaryText = summary.textContent
      pending = true

      if (change === 'period') {
        await user.click(screen.getByTestId(TestID.TimeSelector))
        await user.click(screen.getByRole('menuitem', { name: '7D volume' }))
      } else {
        act(() => {
          window.history.pushState(
            null,
            '',
            change === 'network' ? '/explore/hooks/ethereum' : '/explore/hooks?hookSearch=stable',
          )
          window.dispatchEvent(new PopStateEvent('popstate'))
        })
      }

      await waitFor(() => expect(previousRow.closest('[aria-busy="true"]')).not.toBeNull())
      expect(rowIds()).toEqual(['hk_7b8a2e'])
      expect(row('hk_7b8a2e')).toBe(previousRow)
      expect(previousRow.textContent).toBe(previousText)
      expect(identity).toHaveAttribute('href', previousHref)
      expect(summary.textContent).toBe(summaryText)
      expect(summary.querySelector('[aria-busy="true"]')).toBeNull()
      expect(fetchSummary).toHaveBeenCalledTimes(1)

      act(() => {
        const url = new URL(window.location.href)
        url.searchParams.set('featureFlagOverride', 'hooks_explore_ux')
        window.history.pushState(null, '', url)
        window.dispatchEvent(new PopStateEvent('popstate'))
      })

      expect(previousRow.textContent).toBe(previousText)
      expect(identity).toHaveAttribute('href', `${previousHref}&featureFlagOverride=hooks_explore_ux`)

      const mainnetDeployment = angstrom.deployments[0]
      const nextHook: Hook =
        change === 'search'
          ? fixture('hk_c51e09')
          : change === 'network'
            ? { ...angstrom, deployments: [mainnetDeployment], metrics: mainnetDeployment.metrics }
            : angstrom
      await act(async () => {
        resolveNext(page([nextHook]))
        await nextRequest
      })

      await waitFor(() => expect(row(nextHook.id).closest('[aria-busy="true"]')).toBeNull())
      expect(rowIds()).toEqual([nextHook.id])
      if (change === 'network') {
        expect(within(row(nextHook.id)).getByRole('link', { name: 'Angstrom on Ethereum' })).toHaveAttribute(
          'href',
          '/explore/hooks/ethereum/0x1111111111111111111111111111111111111111?hookReferrer=list&featureFlagOverride=hooks_explore_ux',
        )
        expect(within(row(nextHook.id)).getByText('USD 10100000')).toBeInTheDocument()
      } else if (change === 'period') {
        expect(within(row(nextHook.id)).getByText('USD 92100000')).toBeInTheDocument()
      } else {
        expect(screen.queryByTestId(`${TestID.HookListRow}-hk_7b8a2e`)).not.toBeInTheDocument()
      }
      expect(summary.textContent).toBe(summaryText)
      expect(fetchSummary).toHaveBeenCalledTimes(1)
    },
  )

  it('retries failed totals while keeping a successful list visible', async () => {
    const fetchSummary = vi
      .fn<() => typeof HOOK_LIST_SUMMARY_FIXTURE>()
      .mockImplementationOnce(() => {
        throw new Error('Summary request failed')
      })
      .mockReturnValue(HOOK_LIST_SUMMARY_FIXTURE)
    vi.mocked(hookListSummaryQueryOptions).mockImplementation((options) => ({
      ...originalSummaryOptions(options),
      queryFn: fetchSummary,
    }))
    mockPages(() => page([fixture('hk_7b8a2e')]))
    renderPreview()
    await screen.findByText('Angstrom')
    const summary = screen.getByTestId(TestID.HooksSummary)
    expect(await within(summary).findByRole('status')).toHaveTextContent('Couldn’t load hook totals.')
    expect(screen.queryByText('Error loading data')).not.toBeInTheDocument()

    await userEvent.click(within(summary).getByRole('button', { name: 'Retry' }))

    expect(await within(summary).findByText('USD 4300640000')).toBeInTheDocument()
    expect(rowIds()).toEqual(['hk_7b8a2e'])
    expect(fetchSummary).toHaveBeenCalledTimes(2)
    expect(within(summary).queryByRole('status')).not.toBeInTheDocument()
  })

  it('keeps ordinary search telemetry outside the filter modal context', async () => {
    const user = userEvent.setup()
    renderPreview()
    await screen.findByText('Angstrom')

    await user.click(screen.getByRole('textbox', { name: 'Search hooks by name or address' }))

    const searchEvents = sendEvent.mock.calls.filter(([event]) => event === InterfaceEventName.ExploreSearchSelected)
    expect(searchEvents).toHaveLength(1)
    expect(searchEvents[0]?.[1]).not.toHaveProperty('modal')
    await user.click(screen.getByTestId(TestID.HooksFilterButton))

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
    expect(sendEvent.mock.calls.some(([, properties]) => properties.modal === ModalName.HooksFilter)).toBe(true)
    expect(screen.getByRole('switch', { name: 'Metadata' })).toHaveAccessibleDescription(
      'Only show Hooks with metadata such as names and descriptions.',
    )
  })

  it('keeps filter edits in the dialog until Apply and uses committed filters for queries, counts and impressions', async () => {
    const user = userEvent.setup()
    renderPreview('/explore/hooks?hookTvl=gt-10m&hookRouted=true&hookVerifiedSource=true&hookMetadata=true')
    await screen.findByText('Angstrom')
    expect(rowIds()).toEqual(['hk_7b8a2e', 'hk_c51e09'])
    expect(screen.getByTestId(TestID.HooksFilterButtonBadge)).toHaveTextContent('4')
    expect(
      sendEvent.mock.calls.find(
        ([event, properties]) => event === 'Page Viewed' && properties.page === 'hooks_list',
      )?.[1],
    ).toMatchObject({ filters: ['tvl:gt-10m', 'routed', 'verified_source', 'metadata'] })
    const committedUrl = window.location.href
    const queryCount = queryClient.getQueryCache().getAll().length
    await user.click(screen.getByTestId(TestID.HooksFilterButton))
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(within(dialog).getByRole('switch', { name: 'Verified source code' })).toBeChecked()
    expect(within(dialog).getByRole('switch', { name: 'Metadata' })).toBeChecked()

    await user.click(within(dialog).getByRole('button', { name: '$10M+' }))
    await user.click(within(dialog).getByRole('switch', { name: 'Routed in pools' }))
    await user.click(within(dialog).getByRole('switch', { name: 'Verified source code' }))

    expect(window.location.href).toBe(committedUrl)
    expect(rowIds()).toEqual(['hk_7b8a2e', 'hk_c51e09'])
    expect(queryClient.getQueryCache().getAll()).toHaveLength(queryCount)
    expect(screen.getByTestId(TestID.HooksFilterButtonBadge)).toHaveTextContent('4')
    await user.click(within(dialog).getByRole('button', { name: 'Apply' }))

    await waitFor(() => expect(rowIds()).toEqual(['hk_7b8a2e', 'hk_c51e09', 'hk_53d1ca', 'hk_86a4c3', 'hk_a93c10']))
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument()
    expect(screen.getByTestId(TestID.HooksFilterButtonBadge)).toHaveTextContent('1')
    expect(new URLSearchParams(window.location.search).has('hookTvl')).toBe(false)
    expect(new URLSearchParams(window.location.search).has('hookRouted')).toBe(false)
    expect(new URLSearchParams(window.location.search).has('hookVerifiedSource')).toBe(false)
    expect(new URLSearchParams(window.location.search).get('hookMetadata')).toBe('true')
    const applied = queryClient.getQueryData<InfiniteData<HookListPage>>(
      originalListOptions({ pageSize: 100, filters: { ...EMPTY_HOOK_FILTER_STATE, metadataOnly: true } }).queryKey,
    )
    expect(applied?.pageParams).toEqual([''])
  })

  it('discards cancelled edits and reopens with the applied filters', async () => {
    const user = userEvent.setup()
    renderPreview('/explore/hooks?hookTvl=100k-1m')
    await screen.findByText('Configured hook preview')
    const committedUrl = window.location.href
    await user.click(screen.getByTestId(TestID.HooksFilterButton))
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(within(dialog).getByRole('button', { name: '$100k – $1M' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(dialog).getByRole('button', { name: '$10M+' }))
    await user.click(within(dialog).getByRole('switch', { name: 'Verified source code' }))
    await user.click(screen.getByTestId(TestID.HooksFilterClose))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument())
    expect(window.location.href).toBe(committedUrl)
    expect(rowIds()).toEqual(['hk_86a4c3'])
    expect(screen.getByTestId(TestID.HooksFilterButtonBadge)).toHaveTextContent('1')
    await user.click(screen.getByTestId(TestID.HooksFilterButton))

    const reopened = screen.getByRole('dialog', { name: 'Filters' })
    expect(within(reopened).getByRole('button', { name: '$100k – $1M' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(reopened).getByRole('button', { name: '$10M+' })).toHaveAttribute('aria-pressed', 'false')
    expect(within(reopened).getByRole('switch', { name: 'Verified source code' })).not.toBeChecked()
  })

  it('locks page scrolling and restores focus after Escape without committing the filter draft', async () => {
    const user = userEvent.setup()
    const previousOverflow = document.documentElement.style.overflow
    renderPreview()
    await screen.findByText('Angstrom')
    const committedUrl = window.location.href
    const trigger = screen.getByTestId(TestID.HooksFilterButton)

    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await waitFor(() => expect(document.documentElement.style.overflow).toBe('hidden'))
    await user.click(within(dialog).getByRole('switch', { name: 'Metadata' }))
    expect(within(dialog).getByRole('switch', { name: 'Metadata' })).toBeChecked()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument())
    await waitFor(() => expect(document.documentElement.style.overflow).toBe(previousOverflow))
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(window.location.href).toBe(committedUrl)
    await user.click(trigger)

    expect(
      within(screen.getByRole('dialog', { name: 'Filters' })).getByRole('switch', { name: 'Metadata' }),
    ).not.toBeChecked()
  })

  it('clears advanced filters immediately, keeps the dialog open and resets pagination without changing list context', async () => {
    const user = userEvent.setup()
    const hooks = Array.from({ length: 6 }, (_, index) => ({
      ...fixture('hk_86a4c3'),
      id: `pagination-${index}`,
      name: `Hook ${index}`,
    }))
    mockPages((cursor) => (cursor ? page(hooks.slice(5)) : page(hooks.slice(0, 5), 'next-page')))
    renderPreview(
      '/explore/hooks/base?hookSearch=Hook&hookSort=tvl&hookSortDirection=asc&hookMetadata=true&featureFlagOverride=hooks_explore_ux&lng=en-US',
    )
    await screen.findByText('Hook 0')
    await user.click(screen.getByTestId(TestID.TimeSelector))
    await user.click(screen.getByRole('menuitem', { name: '7D volume' }))
    await waitFor(() => expect(within(row('pagination-0')).getByText('USD 48000')).toBeInTheDocument())
    scrollToNextPage()
    await waitFor(() =>
      expect(rowIds()).toEqual([
        'pagination-0',
        'pagination-1',
        'pagination-2',
        'pagination-3',
        'pagination-4',
        'pagination-5',
      ]),
    )
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(0)
    fireEvent.scroll(window)
    await user.click(screen.getByTestId(TestID.HooksFilterButton))
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    await user.click(within(dialog).getByRole('switch', { name: 'Routed in pools' }))

    await user.click(screen.getByTestId(TestID.HooksFilterClearAll))

    await waitFor(() =>
      expect(rowIds()).toEqual(['pagination-0', 'pagination-1', 'pagination-2', 'pagination-3', 'pagination-4']),
    )
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBe(dialog)
    for (const toggle of within(dialog).getAllByRole('switch')) {
      expect(toggle).not.toBeChecked()
    }
    expect(screen.queryByTestId(TestID.HooksFilterButtonBadge)).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/explore/hooks/base')
    expect(Object.fromEntries(new URLSearchParams(window.location.search))).toEqual({
      hookSearch: 'Hook',
      hookSort: 'tvl',
      hookSortDirection: 'asc',
      featureFlagOverride: 'hooks_explore_ux',
      lng: 'en-US',
    })
    expect(screen.getByTestId(TestID.TimeSelector)).toHaveTextContent('7D volume')
    const cleared = queryClient.getQueryData<InfiniteData<HookListPage>>(
      originalListOptions({
        pageSize: 100,
        chainId: UniverseChainId.Base,
        search: 'hook',
        sortField: HookSortField.Tvl,
        sortDirection: OrderDirection.Asc,
        period: '7d',
      }).queryKey,
    )
    expect(cleared?.pageParams).toEqual([''])
  })

  it('keeps an open draft local through Back and reseeds it from committed filters when reopened', async () => {
    const user = userEvent.setup()
    renderPreview('/explore/hooks?hookMetadata=true')
    await screen.findByText('Angstrom')
    await user.click(screen.getByTestId(TestID.HooksFilterButton))
    await user.click(screen.getByRole('switch', { name: 'Routed in pools' }))
    await user.click(screen.getByTestId(TestID.HooksFilterApply))
    await waitFor(() => expect(rowIds()).toEqual(['hk_7b8a2e', 'hk_c51e09']))
    await user.click(screen.getByTestId(TestID.HooksFilterButton))
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    await user.click(within(dialog).getByRole('switch', { name: 'Verified source code' }))

    act(() => window.history.back())

    await waitFor(() => expect(new URLSearchParams(window.location.search).has('hookRouted')).toBe(false))
    expect(within(dialog).getByRole('switch', { name: 'Routed in pools' })).toBeChecked()
    expect(within(dialog).getByRole('switch', { name: 'Verified source code' })).toBeChecked()
    await user.click(screen.getByTestId(TestID.HooksFilterClose))
    await user.click(screen.getByTestId(TestID.HooksFilterButton))
    const reopened = screen.getByRole('dialog', { name: 'Filters' })
    expect(within(reopened).getByRole('switch', { name: 'Routed in pools' })).not.toBeChecked()
    expect(within(reopened).getByRole('switch', { name: 'Verified source code' })).not.toBeChecked()
    expect(within(reopened).getByRole('switch', { name: 'Metadata' })).toBeChecked()
  })

  it('opens the address-matched Base deployment with full-group metrics and only allowed detail parameters', async () => {
    const snapshot = structuredClone(HOOK_FIXTURES)
    mockPages(() => page([fixture('hk_c51e09'), fixture('hk_7b8a2e')]))
    renderPreview(
      '/explore/hooks?hookSearch=0x2222222222222222222222222222222222222222&hookSort=tvl&hookSortDirection=asc&featureFlagOverride=hooks_explore_ux&lng=en-US&unrelated=drop',
    )

    const identity = await screen.findByRole('link', { name: 'Angstrom on Ethereum, Base' })
    expect(rowIds()).toEqual(['hk_7b8a2e'])
    const angstrom = within(row('hk_7b8a2e'))
    expect(angstrom.getByText('36')).toBeInTheDocument()
    expect(angstrom.getByText('USD 14200000')).toBeInTheDocument()
    expect(angstrom.getByText('USD 38500000')).toBeInTheDocument()
    expect(
      sendEvent.mock.calls.find(
        ([event, properties]) => event === 'Page Viewed' && properties.page === 'hooks_list',
      )?.[1],
    ).toMatchObject({ chain: 'All', sort: 'tvl_asc', filters: [] })
    const destination = new URL(identity.getAttribute('href') ?? '', window.location.origin)
    expect(destination.pathname).toBe('/explore/hooks/base/0x2222222222222222222222222222222222222222')
    expect([...destination.searchParams]).toEqual([
      ['hookReferrer', 'list'],
      ['featureFlagOverride', 'hooks_explore_ux'],
      ['lng', 'en-US'],
    ])

    await userEvent.click(identity)

    expect(rowClicks()).toHaveLength(1)
    expect(rowClicks()[0]).toMatchObject({
      chain: 'All',
      chain_id: UniverseChainId.Base,
      hook_address: '0x2222222222222222222222222222222222222222',
      position: 1,
      sort: 'tvl_asc',
    })
    expect(screen.getByText('Hook detail destination')).toBeInTheDocument()
    expect(HOOK_FIXTURES).toEqual(snapshot)
  })

  it('changes real metric order in both directions and records the current sort on row clicks', async () => {
    const user = userEvent.setup()
    renderPreview()
    await screen.findByText('Angstrom')

    await user.click(screen.getByRole('button', { name: 'TVL' }))

    await waitFor(() => expect(rowIds()[0]).toBe('hk_c51e09'))
    await user.click(screen.getByRole('button', { name: 'TVL' }))

    await waitFor(() => expect(rowIds()[0]).toBe('hk_53d1ca'))
    expect(new URLSearchParams(window.location.search).get('hookSort')).toBe('tvl')
    expect(new URLSearchParams(window.location.search).get('hookSortDirection')).toBe('asc')
    expect(
      sendEvent.mock.calls
        .filter(([event]) => event === InterfaceEventName.ExploreTableSorted)
        .map(([, properties]) => properties),
    ).toEqual([
      { table_type: 'hooks', sort_method: 'tvl', sort_direction: 'desc', surface: 'explore' },
      { table_type: 'hooks', sort_method: 'tvl', sort_direction: 'asc', surface: 'explore' },
    ])
    const sorted = queryClient.getQueryData<InfiniteData<HookListPage>>(
      originalListOptions({ pageSize: 100, sortField: HookSortField.Tvl, sortDirection: OrderDirection.Asc }).queryKey,
    )
    expect(sorted?.pageParams).toEqual([''])

    await user.click(within(row('hk_53d1ca')).getByRole('link', { name: /Reference-price liquidity management/ }))

    expect(rowClicks()).toHaveLength(1)
    expect(rowClicks()[0]).toMatchObject({
      chain: 'All',
      chain_id: UniverseChainId.Optimism,
      position: 1,
      sort: 'tvl_asc',
    })
  })

  it('uses 1D, 7D and 30D table volume while retaining the authored all-time summary', async () => {
    const user = userEvent.setup()
    renderPreview()
    await screen.findByText('Angstrom')
    const summary = screen.getByTestId(TestID.HooksSummary)
    const summaryText = summary.textContent
    expect(within(summary).getByText('Total hooked pools volume')).toBeInTheDocument()
    expect(within(summary).getByText('USD 4300640000')).toBeInTheDocument()
    expect(within(row('hk_7b8a2e')).getByText('USD 14200000')).toBeInTheDocument()
    expect(rowIds().slice(2, 4)).toEqual(['hk_53d1ca', 'hk_86a4c3'])

    await user.click(screen.getByTestId(TestID.TimeSelector))
    expect(screen.getAllByRole('menuitem')).toHaveLength(3)
    await user.click(screen.getByRole('menuitem', { name: '7D volume' }))

    await waitFor(() => expect(within(row('hk_7b8a2e')).getByText('USD 92100000')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '7D vol' })).toBeInTheDocument()
    expect(rowIds().slice(2, 4)).toEqual(['hk_86a4c3', 'hk_53d1ca'])
    expect(summary.textContent).toBe(summaryText)
    await user.click(screen.getByRole('button', { name: '7D vol' }))
    await waitFor(() => expect(new URLSearchParams(window.location.search).get('hookSortDirection')).toBe('asc'))
    expect(
      sendEvent.mock.calls.filter(([event]) => event === InterfaceEventName.ExploreTableSorted).at(-1)?.[1],
    ).toMatchObject({
      table_type: 'hooks',
      sort_method: 'volume_7d',
      sort_direction: 'asc',
      surface: 'explore',
    })
    await user.click(screen.getByRole('button', { name: '7D vol' }))
    await user.click(screen.getByTestId(TestID.TimeSelector))
    await user.click(screen.getByRole('menuitem', { name: '30D volume' }))

    await waitFor(() => expect(within(row('hk_7b8a2e')).getByText('USD 351400000')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '30D vol' })).toBeInTheDocument()
    scrollToNextPage()
    await waitFor(() => expect(within(row('hk_53d1ca')).getByText('Unavailable')).toBeInTheDocument())
    expect(summary.textContent).toBe(summaryText)
    await user.click(screen.getByTestId(TestID.TimeSelector))
    await user.click(screen.getByRole('menuitem', { name: '1D volume' }))

    await waitFor(() => expect(within(row('hk_7b8a2e')).getByText('USD 14200000')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '1D vol' })).toBeInTheDocument()
    expect(summary.textContent).toBe(summaryText)
  })

  it('does not replace the current search when an older slow query resolves', async () => {
    let resolveOld: (result: HookListPage) => void = () => {
      throw new Error('Old query has not started')
    }
    const oldRequest = new Promise<HookListPage>((resolve) => {
      resolveOld = resolve
    })
    mockPages(async (_cursor, options) => (options.search === 'slow' ? oldRequest : page([fixture('hk_c51e09')])))
    renderPreview('/explore/hooks?hookSearch=slow')
    await waitFor(() => expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument())
    const search = screen.getByRole('textbox', { name: 'Search hooks by name or address' })

    await changeSearch(search, 'stable')

    expect(await screen.findByText('StablePairHook')).toBeInTheDocument()
    await act(async () => {
      resolveOld(page([fixture('hk_7b8a2e')]))
      await oldRequest
    })
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))

    expect(search).toHaveValue('stable')
    expect(new URLSearchParams(window.location.search).get('hookSearch')).toBe('stable')
    expect(rowIds()).toEqual(['hk_c51e09'])
    expect(screen.queryByText('Angstrom')).not.toBeInTheDocument()
    const current = queryClient.getQueryData<InfiniteData<HookListPage>>(
      originalListOptions({ pageSize: 100, search: 'stable' }).queryKey,
    )
    expect(current?.pageParams).toEqual([''])
  })

  it('uses registry metadata only for non-fixture deployments and preserves authored names', async () => {
    const unnamed = fixture('hk_2d15bf')
    const deployment = unnamed.deployments[0]
    const fixtureDeployment: Hook = { ...unnamed, id: 'fixture-deployment', isFixture: false }
    const live: Hook = {
      ...unnamed,
      id: 'live-unnamed',
      isFixture: false,
      deployments: [{ ...deployment, isFixture: false }],
    }
    const named: Hook = { ...live, id: 'live-named', name: '  Authored name  ' }
    seedHooks([unnamed, fixtureDeployment, live, named])
    vi.mocked(useHookRegistryMap).mockReturnValue(
      new Map([
        [
          getHookRegistryKey({ chainId: deployment.chainId, hookAddress: deployment.address }),
          new HookEntry({ name: 'Curated registry name' }),
        ],
      ]),
    )
    renderPreview()

    expect(
      await within(row('live-unnamed')).findByRole('link', { name: 'Curated registry name on Base' }),
    ).toBeInTheDocument()
    expect(within(row('live-named')).getByRole('link', { name: 'Authored name on Base' })).toBeInTheDocument()
    expect(within(row(unnamed.id)).getByRole('link', { name: `${deployment.address} on Base` })).toBeInTheDocument()
    expect(
      within(row(fixtureDeployment.id)).getByRole('link', { name: `${deployment.address} on Base` }),
    ).toBeInTheDocument()
    expect(within(row(unnamed.id)).queryByText('Curated registry name')).not.toBeInTheDocument()
    expect(useHookRegistryMap).toHaveBeenLastCalledWith({ chainId: undefined, enabled: true })
  })

  it.each([
    ['hk_7b8a2e', /^Angstrom on /, 1],
    ['hk_86a4c3', 'Configured hook preview on Base', 2],
  ] as const)(
    'uses the rendered position for %s after dropping an out-of-scope candidate',
    async (id, name, position) => {
      mockPages(() => page([fixture('hk_c51e09'), fixture('hk_7b8a2e'), fixture('hk_86a4c3')]))
      renderPreview('/explore/hooks/base')

      await screen.findByRole('link', { name: 'Configured hook preview on Base' })
      expect(screen.queryByTestId(`${TestID.HookListRow}-hk_c51e09`)).not.toBeInTheDocument()
      expect(
        screen.getAllByTestId(new RegExp(`^${TestID.HookListRow}-`)).map((element) => element.dataset.testid),
      ).toEqual([`${TestID.HookListRow}-hk_7b8a2e`, `${TestID.HookListRow}-hk_86a4c3`])

      await userEvent.click(within(row(id)).getByRole('link', { name }))

      expect(rowClicks()).toHaveLength(1)
      expect(rowClicks()[0]).toMatchObject({ chain: 'base', chain_id: UniverseChainId.Base, position })
    },
  )

  it.each([
    ['/explore/hooks', 'All', 'All', UniverseChainId.Mainnet, '0x1111111111111111111111111111111111111111'],
    [
      '/explore/hooks/base',
      UniverseChainId.Base,
      'base',
      UniverseChainId.Base,
      '0x2222222222222222222222222222222222222222',
    ],
    [
      '/explore/hooks/ethereum',
      UniverseChainId.Mainnet,
      'ethereum',
      UniverseChainId.Mainnet,
      '0x1111111111111111111111111111111111111111',
    ],
  ] as const)(
    'emits one list impression and one row click with the scope for %s',
    async (url, pageChain, clickChain, destinationChain, address) => {
      renderPreview(url)
      const identity = await screen.findByRole('link', { name: /Angstrom on/ })
      const impressions = sendEvent.mock.calls.filter(
        ([event, properties]) => event === 'Page Viewed' && properties.page === 'hooks_list',
      )
      expect(impressions).toHaveLength(1)
      expect(impressions[0]?.[1]).toMatchObject({
        page: 'hooks_list',
        chain: pageChain,
        sort: 'volume_1d_desc',
        filters: [],
      })
      expect(rowClicks()).toHaveLength(0)

      await userEvent.click(identity)

      expect(rowClicks()).toHaveLength(1)
      expect(rowClicks()[0]).toMatchObject({
        hook_address: address,
        chain: clickChain,
        chain_id: destinationChain,
        position: 1,
        sort: 'volume_1d_desc',
      })
      expect(window.location.pathname).toBe(
        `/explore/hooks/${destinationChain === UniverseChainId.Base ? 'base' : 'ethereum'}/${address}`,
      )
      expect(new URLSearchParams(window.location.search).get('hookReferrer')).toBe('list')
      expect(screen.getByText('Hook detail destination')).toBeInTheDocument()
    },
  )

  it('opens status and custom-accounting help without navigating or dispatching a row click', async () => {
    seedHooks([fixture('hk_7b8a2e'), fixture('hk_a93c10')])
    renderPreview()
    const source = await within(row('hk_7b8a2e')).findByRole('button', { name: 'Verified source' })
    const originalUrl = window.location.href
    expect(document.querySelector(OPEN_HELP_SELECTOR)).not.toBeInTheDocument()
    tapHelp(source)
    expect(
      await screen.findByText('This hook’s code is published on block explorers and matches the bytecode.', {
        selector: `${OPEN_HELP_SELECTOR} *`,
      }),
    ).toBeVisible()
    expect(source.closest('a')).toBeNull()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(document.querySelector(OPEN_HELP_SELECTOR)).not.toBeInTheDocument())

    const custom = within(row('hk_a93c10')).getByRole('button', { name: 'Custom Accounting hook' })
    tapHelp(custom)
    expect(
      await screen.findByText('This hook uses custom accounting. Standard volume and fee metrics are unavailable.', {
        selector: `${OPEN_HELP_SELECTOR} *`,
      }),
    ).toBeVisible()
    expect(custom.closest('a')).toBeNull()
    expect(window.location.href).toBe(originalUrl)
    expect(rowClicks()).toHaveLength(0)
  })

  it('keeps open help and native row identity when cached row metrics refresh', async () => {
    seedHooks([fixture('hk_7b8a2e')])
    renderPreview()
    const identity = within(row('hk_7b8a2e')).getByRole('link', { name: /Angstrom on/ })
    const source = within(row('hk_7b8a2e')).getByRole('button', { name: 'Verified source' })
    const tvl = within(row('hk_7b8a2e')).getByRole('link', { name: 'USD 38500000' })
    const originalUrl = window.location.href
    const queryKey = originalListOptions({ pageSize: 100 }).queryKey
    const explanation = 'This hook’s code is published on block explorers and matches the bytecode.'
    tapHelp(source)
    expect(await screen.findByText(explanation, { selector: `${OPEN_HELP_SELECTOR} *` })).toBeVisible()

    act(() => {
      queryClient.setQueryData<InfiniteData<HookListPage>>(
        queryKey,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((loadedPage) => ({
              ...loadedPage,
              hooks: loadedPage.hooks.map((hook) =>
                hook.id === 'hk_7b8a2e' ? { ...hook, metrics: { ...hook.metrics, tvlUsd: 123_456 } } : hook,
              ),
            })),
          },
      )
    })

    expect(await within(row('hk_7b8a2e')).findByText('USD 123456')).toBeInTheDocument()
    expect(source.isConnected).toBe(true)
    expect(identity.isConnected).toBe(true)
    expect(within(row('hk_7b8a2e')).getByRole('button', { name: 'Verified source' })).toBe(source)
    expect(within(row('hk_7b8a2e')).getByRole('link', { name: /Angstrom on/ })).toBe(identity)
    expect(within(row('hk_7b8a2e')).getByRole('link', { name: 'USD 123456' })).toBe(tvl)
    expect(screen.getByText(explanation, { selector: `${OPEN_HELP_SELECTOR} *` })).toBeVisible()
    expect(queryClient.getQueryData<InfiniteData<HookListPage>>(queryKey)?.pages).toHaveLength(1)
    expect(window.location.href).toBe(originalUrl)
    expect(rowClicks()).toHaveLength(0)
  })

  it.each([
    [HooksFixtureScenario.Empty, 'No hooks found'],
    [HooksFixtureScenario.NotFound, 'Hook not found'],
  ])('shows the %s state without substituting another fixture', async (scenario, title) => {
    renderPreview(`/explore/hooks?hooksFixtureScenario=${scenario}`)
    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(screen.queryByText('Angstrom')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more hooks' })).not.toBeInTheDocument()
  })

  it('keeps initial loading explicit without displaying stale fixture rows', async () => {
    renderPreview('/explore/hooks?hooksFixtureScenario=loading')
    await waitFor(() => expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument())
    expect(screen.queryByText('Angstrom')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more hooks' })).not.toBeInTheDocument()
  })

  it('retries an initial request failure through the query without silently substituting fixtures', async () => {
    const fetchPage = vi
      .fn<() => HookListPage>()
      .mockImplementationOnce(() => {
        throw new Error('Initial request failed')
      })
      .mockReturnValue(page([fixture('hk_7b8a2e')]))
    mockPages(fetchPage)
    renderPreview()
    expect(await screen.findByText('Error loading data')).toBeInTheDocument()
    expect(screen.queryByText('Angstrom')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Angstrom')).toBeInTheDocument()
    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('Error loading data')).not.toBeInTheDocument()
  })

  it('retains loaded rows and summary after a next-page error and retries the same cursor', async () => {
    let nextAttempts = 0
    const fetchPage = vi.fn((cursor: string) => {
      if (!cursor) {
        return page([fixture('hk_7b8a2e')], 'retry-this-cursor')
      }
      if (nextAttempts++ === 0) {
        throw new Error('Next page failed')
      }
      return page([fixture('hk_86a4c3')])
    })
    mockPages(fetchPage)
    renderPreview()
    expect(await screen.findByText('Angstrom')).toBeInTheDocument()
    const summaryText = screen.getByTestId(TestID.HooksSummary).textContent
    scrollToNextPage()

    expect(
      await screen.findByText('Couldn’t load more hooks. Your current results are still available.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Angstrom')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.HooksSummary).textContent).toBe(summaryText)
    expect(screen.queryByText('Error loading data')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(await screen.findByText('Configured hook preview')).toBeInTheDocument()
    expect(screen.getByText('Angstrom')).toBeInTheDocument()
    expect(fetchPage.mock.calls.map(([cursor]) => cursor)).toEqual(['', 'retry-this-cursor', 'retry-this-cursor'])
    expect(
      screen.queryByText('Couldn’t load more hooks. Your current results are still available.'),
    ).not.toBeInTheDocument()
  })
})
