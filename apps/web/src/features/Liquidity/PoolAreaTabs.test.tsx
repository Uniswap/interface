import { useMedia } from '@universe/mycelium'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { PoolAreaTabs } from '~/features/Liquidity/PoolAreaTabs'
import { fireEvent, render, screen, within } from '~/test-utils/render'

vi.unmock('uniswap/src/features/telemetry/Trace')
vi.mock('@react-navigation/core', () => ({ useFocusEffect: vi.fn() }))
vi.mock('@uniswap/analytics-events', () => ({
  SharedEventName: {
    ELEMENT_CLICKED: 'Element Clicked',
    NAVBAR_CLICKED: 'Navbar Clicked',
    PAGE_VIEWED: 'Page Viewed',
  },
  BrowserEvent: { onClick: 'onClick', onFocus: 'onFocus', onKeyPress: 'onKeyPress' },
  sendAnalyticsEvent: vi.fn(),
  trace: vi.fn(),
}))

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useMedia: vi.fn(),
}))

const urls = {
  positions: '/positions?chain=base',
  pools: '/explore/pools/base',
  hooks: '/explore/hooks/base',
}

describe('PoolAreaTabs', () => {
  beforeEach(() => {
    vi.mocked(useMedia).mockReturnValue({ md: false } as ReturnType<typeof useMedia>)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(['positions', 'pools', 'hooks'] as const)('selects only the %s destination', (activeTab) => {
    render(<PoolAreaTabs activeTab={activeTab} urls={urls} />)

    const links = within(screen.getByRole('navigation', { name: 'Pools' })).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(Object.values(urls))
    expect(links.filter((link) => link.getAttribute('aria-current') === 'page')).toEqual([
      links[Object.keys(urls).indexOf(activeTab)],
    ])
    expect(screen.getByRole('link', { name: 'Your positions' })).toBeInTheDocument()
  })

  it('uses the compact Positions label on mobile', () => {
    vi.mocked(useMedia).mockReturnValue({ md: true } as ReturnType<typeof useMedia>)
    render(<PoolAreaTabs activeTab="hooks" urls={urls} />)

    expect(screen.getByRole('link', { name: 'Positions' })).toHaveAttribute('href', urls.positions)
    expect(screen.queryByRole('link', { name: 'Your positions' })).not.toBeInTheDocument()
  })

  it.each([
    ['Your positions', 'pool-area-tab-positions'],
    ['Pools', 'pool-area-tab-pools'],
    ['Hooks', 'pool-area-tab-hooks'],
  ])('logs one click for the %s tab', (label, element) => {
    const sendEvent = vi.spyOn(analytics, 'sendEvent').mockImplementation(() => {})
    render(<PoolAreaTabs activeTab="positions" urls={urls} />)

    expect(sendEvent).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('link', { name: label }))

    expect(sendEvent).toHaveBeenCalledExactlyOnceWith('Navbar Clicked', expect.objectContaining({ element }))
  })
})
