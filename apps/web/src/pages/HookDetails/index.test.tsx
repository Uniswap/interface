import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { SharedEventName } from '@uniswap/analytics-events'
import { UniverseChainId } from '@universe/chains'
import { Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { Link, Route, Routes, useSearchParams } from 'react-router'
import type { HookDetailsReferrer } from 'uniswap/src/features/poolHooks/types'
import { ElementName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import type { PoolAreaTab } from '~/features/Explore/poolArea/types'
import { HOOK_FIXTURES } from '~/features/Hooks/fixtures'
import { hookDetailQueryOptions } from '~/features/Hooks/queries'
import type { HookDetail } from '~/features/Hooks/types'
import HookDetailsPage from '~/pages/HookDetails'
import { HookDetailsFallback } from '~/pages/HookDetails/components/HookDetailsFallback'
import { HookDetailsNetworkSelector } from '~/pages/HookDetails/components/HookDetailsNetworkSelector'
import { HookDetailsStatus } from '~/pages/HookDetails/types'
import { act, render, screen, waitFor } from '~/test-utils/render'

const { sendEvent, isSupportedChain } = vi.hoisted(() => ({
  sendEvent: vi.fn<(event: string, properties: Record<string, unknown>) => void>(),
  isSupportedChain: vi.fn<(chainId?: number) => chainId is UniverseChainId>(),
}))

vi.unmock('uniswap/src/features/telemetry/Trace')
vi.mock('@react-navigation/core', () => ({ useFocusEffect: vi.fn() }))
vi.mock('@uniswap/analytics-events', () => ({
  SharedEventName: { PAGE_VIEWED: 'Page Viewed' },
  BrowserEvent: { onClick: 'onClick', onFocus: 'onFocus', onKeyPress: 'onKeyPress' },
  sendAnalyticsEvent: vi.fn(),
  trace: vi.fn(),
}))
vi.mock('utilities/src/telemetry/analytics/analytics', async (importOriginal) => {
  const original = await importOriginal<typeof import('utilities/src/telemetry/analytics/analytics')>()
  return { ...original, analytics: { ...original.analytics, sendEvent } }
})
vi.mock('uniswap/src/features/chains/hooks/useSupportedChainId', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/chains/hooks/useSupportedChainId')>()),
  useIsSupportedChainIdCallback: () => isSupportedChain,
}))

vi.mock('nuqs/adapters/react-router/v7', () => ({
  useOptimisticSearchParams: () => {
    const [searchParams] = useSearchParams()
    return searchParams
  },
}))
vi.mock('~/pages/HookDetails/components/HookDetailsFallback', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/pages/HookDetails/components/HookDetailsFallback')>()
  return { ...original, HookDetailsFallback: vi.fn(original.HookDetailsFallback) }
})
vi.mock('~/pages/HookDetails/components/HookDetailsOverview', () => ({
  HookDetailsOverview: ({
    hook,
    referrer,
    urls,
    isPlaceholderData,
  }: {
    hook: HookDetail
    referrer: HookDetailsReferrer
    urls: Record<PoolAreaTab, string>
    isPlaceholderData?: boolean
  }) => (
    <section aria-label="Hook overview" aria-busy={isPlaceholderData}>
      <Text>{`${hook.deployment.chainId}:${hook.name ?? hook.deployment.address}:${referrer}`}</Text>
      <HookDetailsNetworkSelector
        chainId={hook.deployment.chainId}
        address={hook.deployment.address}
        deployments={hook.deployments}
      />
      <output aria-label="Deployment metrics">{`${hook.deployment.address}:${hook.deployment.metrics.tvlUsd}`}</output>
      <Link to={urls.pools}>Pools breadcrumb</Link>
      <Link to={urls.hooks}>Hooks breadcrumb</Link>
    </section>
  ),
}))

const address = '0x5555555555555555555555555555555555555555'

function pageImpressions(): Record<string, unknown>[] {
  return sendEvent.mock.calls
    .filter(
      ([event, properties]) =>
        event === SharedEventName.PAGE_VIEWED && properties.page === InterfacePageName.HookDetailsPage,
    )
    .map(([, properties]) => properties)
}

function renderPage(path: string, onError = vi.fn()): QueryClient {
  window.history.replaceState({}, '', path)
  const client = new QueryClient({
    queryCache: new QueryCache({ onError }),
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  render(
    <QueryClientProvider client={client}>
      <Routes>
        <Route path="/explore/hooks/:chainName/:hookAddress" element={<HookDetailsPage />} />
        <Route path="/explore" element={<Text>Existing Explore</Text>} />
      </Routes>
    </QueryClientProvider>,
  )
  return client
}

describe('HookDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isSupportedChain.mockImplementation((chainId): chainId is UniverseChainId => chainId !== undefined)
  })

  it('rejects a disabled EVM network without querying', () => {
    isSupportedChain.mockReturnValue(false)

    const client = renderPage(`/explore/hooks/base/${address}`)

    expect(screen.getByRole('heading', { name: 'Unsupported network' })).toBeInTheDocument()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it.each([
    {
      path: `/explore/hooks/ethereum/${address}?hooksFixtureScenario=not-found`,
      heading: 'Hook not found',
      status: HookDetailsStatus.NotFound,
      chain: UniverseChainId.Mainnet,
      hook_address: address,
    },
    {
      path: '/explore/hooks/ethereum/0x123',
      heading: 'Invalid hook address',
      status: HookDetailsStatus.InvalidAddress,
      chain: undefined,
      hook_address: undefined,
    },
  ])(
    'logs one page view for $status with the validated identity when available',
    async ({ path, heading, ...properties }) => {
      renderPage(path)

      await screen.findByRole('heading', { name: heading })

      await waitFor(() => expect(pageImpressions()).toEqual([expect.objectContaining(properties)]))
    },
  )

  it.each(['success', 'error'] as const)(
    'keeps the overview visible during a cold sibling request before %s',
    async (outcome) => {
      const client = renderPage('/explore/hooks/ethereum/0x1111111111111111111111111111111111111111')
      expect(await screen.findByRole('status', { name: 'Deployment metrics' })).toHaveTextContent(
        '0x1111111111111111111111111111111111111111:28000000',
      )
      const previous = client.getQueryData(
        hookDetailQueryOptions({
          chainId: UniverseChainId.Mainnet,
          hookAddress: HOOK_FIXTURES[0]!.deployments[0].address,
        }).queryKey,
      )!
      const baseDetail: HookDetail = { ...previous, deployment: HOOK_FIXTURES[0]!.deployments[1]! }
      let resolveBase: (detail: HookDetail | null) => void = () => {
        throw new Error('Base request has not started')
      }
      let rejectBase: (error: Error) => void = () => {
        throw new Error('Base request has not started')
      }
      const pending = new Promise<HookDetail | null>((resolve, reject) => {
        resolveBase = resolve
        rejectBase = reject
      })
      const request = Promise.allSettled([
        client.fetchQuery({
          ...hookDetailQueryOptions({ chainId: UniverseChainId.Base, hookAddress: baseDetail.deployment.address }),
          queryFn: () => pending,
        }),
      ])
      const overview = screen.getByRole('region', { name: 'Hook overview' })
      vi.mocked(HookDetailsFallback).mockClear()

      await userEvent.click(screen.getByTestId(TestID.TokensNetworkFilterTrigger))
      await userEvent.click(await screen.findByTestId(`${ElementName.NetworkButton}-${UniverseChainId.Base}`))

      expect(screen.getByRole('region', { name: 'Hook overview' })).toBe(overview)
      expect(overview).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByRole('status', { name: 'Deployment metrics' })).toHaveTextContent(
        '0x1111111111111111111111111111111111111111:28000000',
      )
      expect(vi.mocked(HookDetailsFallback).mock.calls.map(([props]) => props.state)).not.toContain(
        HookDetailsStatus.Loading,
      )

      await act(async () => {
        if (outcome === 'success') {
          resolveBase(baseDetail)
        } else {
          rejectBase(new Error('Base request failed'))
        }
        await request
      })

      if (outcome === 'success') {
        await waitFor(() =>
          expect(screen.getByRole('status', { name: 'Deployment metrics' })).toHaveTextContent(
            '0x2222222222222222222222222222222222222222:10500000',
          ),
        )
        expect(screen.getByRole('region', { name: 'Hook overview' })).not.toBe(overview)
        expect(screen.getByRole('region', { name: 'Hook overview' })).toHaveAttribute('aria-busy', 'false')
        expect(screen.queryByText('1:Angstrom:external')).not.toBeInTheDocument()
        expect(screen.getByText('8453:Angstrom:external')).toBeInTheDocument()
      } else {
        expect(await screen.findByRole('alert')).toHaveTextContent('Could not load hook details')
        expect(screen.queryByRole('region', { name: 'Hook overview' })).not.toBeInTheDocument()
      }
      expect(window.location.pathname).toBe('/explore/hooks/base/0x2222222222222222222222222222222222222222')
      expect(vi.mocked(HookDetailsFallback).mock.calls.map(([props]) => props.state)).not.toContain(
        HookDetailsStatus.Loading,
      )
    },
  )

  it.each([
    ['/explore/hooks/solana/' + address, 'Unsupported network'],
    ['/explore/hooks/unknown/' + address, 'Unsupported network'],
    ['/explore/hooks/ethereum/0x123', 'Invalid hook address'],
    ['/explore/hooks/ethereum/0x' + 'z'.repeat(40), 'Invalid hook address'],
  ])('rejects malformed identity without querying at %s', (path, heading) => {
    const client = renderPage(path)

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it.each([
    ['/explore/hooks/base/0x123', 'Invalid hook address', '/explore/hooks'],
    [`/explore/hooks/unknown/${address}`, 'Unsupported network', '/explore/hooks'],
    [`/explore/hooks/ethereum/${address}?hooksFixtureScenario=loading`, 'Loading hook details', '/explore/hooks'],
    [`/explore/hooks/ethereum/${address}?hooksFixtureScenario=error`, 'Could not load hook details', '/explore/hooks'],
    [`/explore/hooks/ethereum/${address}?hooksFixtureScenario=not-found`, 'Hook not found', '/explore/hooks'],
  ])(
    'omits the hook origin from state back navigation while preserving shared parameters at %s',
    async (path, heading, backPath) => {
      const url = new URL(path, window.location.origin)
      url.searchParams.set('featureFlagOverride', 'hooks_explore_ux')
      url.searchParams.set('lng', 'fr-FR')
      url.searchParams.append('hookReferrer', 'list')
      url.searchParams.append('hookReferrer', 'badge')
      renderPage(url.pathname + url.search)

      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
      const link = screen.getByRole('link', { name: 'Back to Hooks' })
      const destination = new URL(link.getAttribute('href') ?? '', window.location.origin)
      expect(destination.pathname).toBe(backPath)
      expect(destination.searchParams.get('featureFlagOverride')).toBe('hooks_explore_ux')
      expect(destination.searchParams.get('lng')).toBe('fr-FR')
      expect(destination.searchParams.has('hookReferrer')).toBe(false)
    },
  )

  it('passes the selected deployment, origin and origin-free shared navigation to the overview', async () => {
    renderPage(`/explore/hooks/ethereum/${address}?featureFlagOverride=hooks_explore_ux&lng=fr-FR&hookReferrer=badge`)

    expect(await screen.findByText('1:StablePairHook:badge')).toBeInTheDocument()
    for (const { name, path } of [
      { name: 'Pools breadcrumb', path: '/explore/pools' },
      { name: 'Hooks breadcrumb', path: '/explore/hooks' },
    ]) {
      const link = screen.getByRole('link', { name })
      const destination = new URL(link.getAttribute('href') ?? '', window.location.origin)
      expect(destination.pathname).toBe(path)
      expect(destination.searchParams.get('featureFlagOverride')).toBe('hooks_explore_ux')
      expect(destination.searchParams.get('lng')).toBe('fr-FR')
      expect(destination.searchParams.has('hookReferrer')).toBe(false)
    }
  })

  it('keeps loading distinct from missing metadata and not-found states', () => {
    renderPage(`/explore/hooks/ethereum/${address}?hooksFixtureScenario=loading`)

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('heading', { name: 'Loading hook details' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Hook not found' })).not.toBeInTheDocument()
    expect(pageImpressions()).toEqual([])
  })

  it.each([`/explore/hooks/base/${address}`, `/explore/hooks/ethereum/${address}?hooksFixtureScenario=not-found`])(
    'shows not found for an absent deployment at %s',
    async (path) => {
      renderPage(path)

      expect(await screen.findByRole('heading', { name: 'Hook not found' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    },
  )

  it('keeps fetch failure distinct and retries the failed request', async () => {
    const onError = vi.fn()
    renderPage(`/explore/hooks/ethereum/${address}?hooksFixtureScenario=error`, onError)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load hook details')
    expect(onError).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load hook details')
  })
})
