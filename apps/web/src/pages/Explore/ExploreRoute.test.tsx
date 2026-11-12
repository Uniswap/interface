import { FeatureFlags, useFeatureFlag, useStatsigClientStatus } from '@universe/gating'
import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
// oxlint-disable-next-line universe-custom/import-boundary -- route-wiring test renders the app shell on purpose
import { Body } from '~/app/layout/Body'
import { TimePeriod } from '~/data/util'
import { useEffectiveVolumeTimePeriod } from '~/features/Explore/hooks/useEffectiveVolumeTimePeriod'
import { useExploreParams } from '~/features/Explore/hooks/useExploreParams'
import {
  AuctionQuickFilter,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { LIVE_POOL_VOLUME_PERIODS } from '~/features/Explore/timeLabels'
import { useSyncAuctionQuickFilterParam } from '~/pages/Explore/hooks/useAuctionQuickFilterParam'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'
import { ExploreTab } from '~/types/explore'

vi.mock('~/pages/Swap', () => ({
  SwapPage: () => React.createElement(React.Fragment),
  Swap: () => React.createElement(React.Fragment),
}))

vi.mock('~/pages/Explore', () => ({ default: ExploreProbe }))
vi.mock('~/pages/Explore/PoolsPage', () => ({
  default: () => <PeriodProbe surface="Pools" supportedPeriods={LIVE_POOL_VOLUME_PERIODS} />,
}))
vi.mock('~/pages/Explore/HooksPage', () => ({
  default: () => <PeriodProbe surface="Hooks" />,
}))
vi.mock('~/pages/HookDetails', () => ({
  default: () => <PeriodProbe surface="Hook detail" supportedPeriods={LIVE_POOL_VOLUME_PERIODS} />,
}))
vi.mock('~/pages/TokenDetails/TokenDetailsPage', () => ({
  default: () => <div>Token details</div>,
}))

function PeriodProbe({
  surface,
  supportedPeriods,
}: {
  surface: string
  supportedPeriods?: readonly TimePeriod[]
}): JSX.Element {
  const rawPeriod = useExploreTablesFilterStore((state) => state.timePeriod)
  const effectivePeriod = useEffectiveVolumeTimePeriod(supportedPeriods)
  const { setTimePeriod } = useExploreTablesFilterStoreActions()

  return (
    <>
      <div>{surface}</div>
      <output aria-label="Raw period">{rawPeriod}</output>
      <output aria-label="Effective period">{effectivePeriod}</output>
      <button onClick={() => setTimePeriod(TimePeriod.HOUR)}>Select 1H</button>
      <button onClick={() => setTimePeriod(TimePeriod.MONTH)}>Select 30D</button>
    </>
  )
}

function AuctionProbe(): JSX.Element {
  const quickFilter = useExploreTablesFilterStore((state) => state.quickFilter)
  const [initialQuickFilter] = useState(quickFilter)
  useSyncAuctionQuickFilterParam()

  return (
    <>
      <output aria-label="Initial auction filter">{initialQuickFilter}</output>
      <output aria-label="Auction filter">{quickFilter}</output>
    </>
  )
}

function ExploreProbe(): JSX.Element {
  const { tab } = useExploreParams()
  return (
    <>
      <PeriodProbe surface="Existing Explore" />
      {tab === ExploreTab.Toucan && <AuctionProbe />}
    </>
  )
}

function NavigationProbe(): JSX.Element {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output aria-label="Current URL">{`${pathname}${search}`}</output>
      <Link to="/explore/tokens/ethereum?category=lending">Ethereum tokens</Link>
      <Link to="/explore/tokens/base?category=lending">Base tokens</Link>
      <Link to="/explore/pools/base?category=lending">Base pools</Link>
      <Link to="/explore/pools/optimism?category=lending">Optimism pools</Link>
      <Link to="/explore/hooks/optimism?category=lending">Optimism hooks</Link>
      <Link to="/explore/hooks/base/0x2222222222222222222222222222222222222222">Base hook detail</Link>
      <Link to="/explore/auctions?filter=verified&category=lending">Verified auctions</Link>
      <button onClick={() => navigate(-1)}>Browser back</button>
      <button onClick={() => navigate(1)}>Browser forward</button>
    </>
  )
}

function renderAt(path: string): ReturnType<typeof render> {
  window.history.replaceState(null, '', path)
  return render(
    <>
      <Body shouldRenderAppChrome={false} />
      <NavigationProbe />
    </>,
  )
}

describe('Explore route filter lifetime', () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.HooksExplore)
  })

  it('retains the shared pool period across the Pools and hook-detail page boundaries', async () => {
    renderAt('/explore/pools/base')
    await screen.findByText('Pools')
    fireEvent.click(screen.getByRole('button', { name: 'Select 30D' }))
    fireEvent.click(screen.getByRole('link', { name: 'Base hook detail' }))
    await screen.findByText('Hook detail')
    expect(screen.getByLabelText('Effective period')).toHaveTextContent(TimePeriod.MONTH)
    fireEvent.click(screen.getByRole('link', { name: 'Base pools' }))
    await screen.findByText('Pools')
    expect(screen.getByLabelText('Effective period')).toHaveTextContent(TimePeriod.MONTH)
  })

  it('retains the token period through gated pools, history navigation, chain changes and hooks', async () => {
    renderAt('/explore/tokens/ethereum?category=lending')
    await screen.findByText('Existing Explore')
    fireEvent.click(screen.getByRole('button', { name: 'Select 1H' }))
    expect(screen.getByLabelText('Raw period')).toHaveTextContent(TimePeriod.HOUR)

    fireEvent.click(screen.getByRole('link', { name: 'Base pools' }))
    await screen.findByText('Pools')
    expect(screen.getByLabelText('Current URL')).toHaveTextContent('/explore/pools/base?category=lending')
    expect(screen.getByLabelText('Raw period')).toHaveTextContent(TimePeriod.HOUR)
    expect(screen.getByLabelText('Effective period')).toHaveTextContent(TimePeriod.DAY)

    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Current URL')).toHaveTextContent('/explore/tokens/ethereum?category=lending'),
    )
    expect(screen.getByLabelText('Effective period')).toHaveTextContent(TimePeriod.HOUR)

    fireEvent.click(screen.getByRole('button', { name: 'Browser forward' }))
    await screen.findByText('Pools')
    expect(screen.getByLabelText('Raw period')).toHaveTextContent(TimePeriod.HOUR)
    expect(screen.getByLabelText('Effective period')).toHaveTextContent(TimePeriod.DAY)

    fireEvent.click(screen.getByRole('link', { name: 'Optimism pools' }))
    await waitFor(() =>
      expect(screen.getByLabelText('Current URL')).toHaveTextContent('/explore/pools/optimism?category=lending'),
    )
    expect(screen.getByLabelText('Raw period')).toHaveTextContent(TimePeriod.HOUR)
    expect(screen.getByLabelText('Effective period')).toHaveTextContent(TimePeriod.DAY)

    fireEvent.click(screen.getByRole('link', { name: 'Base tokens' }))
    await screen.findByText('Existing Explore')
    expect(screen.getByLabelText('Effective period')).toHaveTextContent(TimePeriod.HOUR)

    fireEvent.click(screen.getByRole('link', { name: 'Optimism hooks' }))
    await screen.findByText('Hooks')
    expect(screen.getByLabelText('Raw period')).toHaveTextContent(TimePeriod.HOUR)

    fireEvent.click(screen.getByRole('link', { name: 'Ethereum tokens' }))
    await screen.findByText('Existing Explore')
    expect(screen.getByLabelText('Raw period')).toHaveTextContent(TimePeriod.HOUR)
  })

  it('keeps the existing generic Explore lifetime when Hooks Explore is disabled', async () => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    renderAt('/explore/tokens/ethereum')
    await screen.findByText('Existing Explore')
    fireEvent.click(screen.getByRole('button', { name: 'Select 1H' }))

    fireEvent.click(screen.getByRole('link', { name: 'Base pools' }))

    await waitFor(() => expect(screen.getByLabelText('Current URL')).toHaveTextContent('/explore/pools/base'))
    expect(screen.getByText('Existing Explore')).toBeInTheDocument()
    expect(screen.queryByText('Pools')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Effective period')).toHaveTextContent(TimePeriod.HOUR)
  })

  it('preserves the legacy chain redirect and then shares its filter store with Pools', async () => {
    renderAt('/tokens/base')
    await screen.findByText('Existing Explore')
    expect(screen.getByLabelText('Current URL')).toHaveTextContent('/explore/tokens/base')
    fireEvent.click(screen.getByRole('button', { name: 'Select 1H' }))

    fireEvent.click(screen.getByRole('link', { name: 'Base pools' }))

    await screen.findByText('Pools')
    expect(screen.getByLabelText('Raw period')).toHaveTextContent(TimePeriod.HOUR)
  })

  it('preserves the legacy token detail redirect', async () => {
    const tokenAddress = '0x000000000000000000000000000000000000abcd'
    renderAt(`/tokens/base/${tokenAddress}`)

    await screen.findByText('Token details')

    expect(screen.getByLabelText('Current URL')).toHaveTextContent(`/explore/tokens/base/${tokenAddress}`)
  })

  it.each([
    { filter: AuctionQuickFilter.Verified, ready: true, enabled: false, expected: AuctionQuickFilter.Verified },
    { filter: AuctionQuickFilter.QuickLaunch, ready: false, enabled: false, expected: AuctionQuickFilter.QuickLaunch },
    { filter: AuctionQuickFilter.QuickLaunch, ready: true, enabled: false, expected: AuctionQuickFilter.All },
    { filter: AuctionQuickFilter.QuickLaunch, ready: true, enabled: true, expected: AuctionQuickFilter.QuickLaunch },
  ])(
    'seeds $filter before the first auction render (ready=$ready, enabled=$enabled)',
    async ({ filter, ready, enabled, expected }) => {
      vi.mocked(useFeatureFlag).mockImplementation(
        (flag) => flag === FeatureFlags.HooksExplore || (flag === FeatureFlags.QuickLaunch && enabled),
      )
      vi.mocked(useStatsigClientStatus).mockReturnValue({
        isStatsigReady: ready,
        isStatsigLoading: !ready,
        isStatsigUninitialized: false,
      })
      renderAt(`/explore/auctions?filter=${filter}&category=lending`)

      expect(await screen.findByLabelText('Initial auction filter')).toHaveTextContent(filter)
      await waitFor(() => expect(screen.getByLabelText('Auction filter')).toHaveTextContent(expected))
      const params = new URLSearchParams(window.location.search)
      expect(params.get('category')).toBe('lending')
      expect(params.get('filter')).toBe(expected === AuctionQuickFilter.All ? null : expected)
    },
  )

  it('adopts an explicit auction filter when navigating within an already-mounted Explore owner', async () => {
    renderAt('/explore/tokens/ethereum')
    await screen.findByText('Existing Explore')
    fireEvent.click(screen.getByRole('button', { name: 'Select 1H' }))

    fireEvent.click(screen.getByRole('link', { name: 'Verified auctions' }))

    await screen.findByLabelText('Auction filter')
    await waitFor(() => expect(screen.getByLabelText('Auction filter')).toHaveTextContent(AuctionQuickFilter.Verified))
    expect(screen.getByLabelText('Raw period')).toHaveTextContent(TimePeriod.HOUR)
    expect(new URLSearchParams(window.location.search).get('filter')).toBe('verified')
  })
})
