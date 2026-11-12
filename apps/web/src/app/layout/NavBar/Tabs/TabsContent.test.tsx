import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Link, useSearchParams } from 'react-router'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useTabsContent } from '~/app/layout/NavBar/Tabs/TabsContent'
import { PortfolioTab } from '~/hooks/usePortfolioRoutes/types'
import { usePortfolioRoutes } from '~/hooks/usePortfolioRoutes/usePortfolioRoutes'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, renderHook, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('~/hooks/usePortfolioRoutes/usePortfolioRoutes', () => ({
  usePortfolioRoutes: vi.fn(),
}))

vi.mock('nuqs/adapters/react-router/v7', () => ({
  useOptimisticSearchParams: () => {
    const [searchParams] = useSearchParams()
    return searchParams
  },
}))

let isHooksExploreEnabled = false

function getTabState(elementName: ElementName): boolean | undefined {
  const { result } = renderHook(() => useTabsContent())
  return result.current.find((tab) => tab.elementName === elementName)?.isActive
}

function PoolNavigationHarness(): JSX.Element {
  const tabs = useTabsContent()
  return (
    <>
      {tabs
        .find((tab) => tab.elementName === ElementName.NavbarPoolTab)
        ?.items?.map((item) => (
          <Link key={item.elementName} to={item.href}>
            {item.label}
          </Link>
        ))}
      <output aria-label="Pool selection">
        {tabs.find((tab) => tab.elementName === ElementName.NavbarPoolTab)?.isActive ? 'active' : 'inactive'}
      </output>
      <output aria-label="Portfolio selection">
        {tabs.find((tab) => tab.elementName === ElementName.NavbarPortfolioTab)?.isActive ? 'active' : 'inactive'}
      </output>
    </>
  )
}

describe('useTabsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.pushState({}, '', '/')
    isHooksExploreEnabled = false
    mocked(useFeatureFlag).mockImplementation(
      (flag) =>
        flag === FeatureFlags.PortfolioPoolsBalances || (isHooksExploreEnabled && flag === FeatureFlags.HooksExplore),
    )
    mocked(usePortfolioRoutes).mockReturnValue({
      tab: PortfolioTab.Overview,
      chainId: undefined,
      externalAddress: undefined,
      isExternalWallet: false,
    })
  })

  it.each(['/positions/add/new', '/liquidity/launch-auction'])(
    'keeps Pool active without a Portfolio entry point while the gate is off at %s',
    (pathname) => {
      window.history.pushState({}, '', pathname)

      expect(getTabState(ElementName.NavbarPoolTab)).toBe(true)
      expect(getTabState(ElementName.NavbarPortfolioTab)).toBe(false)
    },
  )

  it.each([
    '/explore/pools',
    '/explore/pools/base',
    '/explore/pools/base/0x123',
    '/explore/hooks',
    '/explore/hooks/base',
    '/explore/hooks/base/0x123',
  ])('selects only Pool for the enabled area at %s', (path) => {
    isHooksExploreEnabled = true
    window.history.pushState({}, '', path)

    expect(getTabState(ElementName.NavbarPoolTab)).toBe(true)
    expect(getTabState(ElementName.NavbarExploreTab)).toBe(false)
  })

  it('retains the existing Explore selection and Pool menu while the gate is disabled', () => {
    window.history.pushState({}, '', '/explore/pools/base')
    const { result } = renderHook(() => useTabsContent())
    const poolTab = result.current.find((tab) => tab.elementName === ElementName.NavbarPoolTab)

    expect(poolTab?.isActive).toBe(false)
    expect(result.current.find((tab) => tab.elementName === ElementName.NavbarExploreTab)?.isActive).toBe(true)
    expect(poolTab?.items?.map((item) => item.elementName)).toEqual([
      ElementName.NavbarPoolDropdownViewPositions,
      ElementName.NavbarPoolDropdownCreatePosition,
      ElementName.NavbarPoolDropdownLaunchAuction,
    ])
  })

  it('orders the enabled Pool menu and carries the current network and query', () => {
    isHooksExploreEnabled = true
    window.history.pushState({}, '', '/positions?chain=base&qaQuery=retained')
    const { result } = renderHook(() => useTabsContent())
    const poolTab = result.current.find((tab) => tab.elementName === ElementName.NavbarPoolTab)

    expect(poolTab?.items?.map(({ label, href }) => ({ label, href }))).toEqual([
      { label: 'Positions', href: '/positions?chain=base&qaQuery=retained' },
      { label: 'Pools', href: '/explore/pools/base?qaQuery=retained' },
      { label: 'Hooks', href: '/explore/hooks/base?qaQuery=retained' },
      { label: 'Create position', href: '/positions/add' },
      { label: 'Launch token', href: '/liquidity/launch-auction' },
    ])
  })

  it('keeps Portfolio entry precedence with the new menu enabled', () => {
    isHooksExploreEnabled = true
    window.history.pushState({}, '', '/positions/add/new?entryPoint=%2Fportfolio%2Fpools')

    expect(getTabState(ElementName.NavbarPoolTab)).toBe(false)
    expect(getTabState(ElementName.NavbarPortfolioTab)).toBe(true)
  })

  it.each([
    ['Positions', '/positions'],
    ['Pools', '/explore/pools/base'],
    ['Hooks', '/explore/hooks/base'],
  ])('clears the creation context when leaving Portfolio Create through %s', (label, destination) => {
    isHooksExploreEnabled = true
    window.history.replaceState(
      { usr: { entryPoint: '/portfolio/pools' } },
      '',
      '/positions/add/new?chain=base&entryPoint=%2Fportfolio%2Fpools&qaQuery=discarded&lng=fr-FR&featureFlagOverride=hooks_explore_ux&currencyA=ETH&depositState=private',
    )
    render(<PoolNavigationHarness />)
    expect(screen.getByLabelText('Pool selection')).toHaveTextContent(/^inactive$/)
    expect(screen.getByLabelText('Portfolio selection')).toHaveTextContent(/^active$/)

    fireEvent.click(screen.getByRole('link', { name: label }))

    expect(window.location.pathname).toBe(destination)
    expect(new URLSearchParams(window.location.search).has('entryPoint')).toBe(false)
    const destinationParams = new URLSearchParams(window.location.search)
    expect(destinationParams.get('chain')).toBe(label === 'Positions' ? 'base' : null)
    expect(destinationParams.get('lng')).toBe('fr-FR')
    expect(destinationParams.get('featureFlagOverride')).toBe('hooks_explore_ux')
    expect(destinationParams.has('qaQuery')).toBe(false)
    expect(destinationParams.has('currencyA')).toBe(false)
    expect(destinationParams.has('depositState')).toBe(false)
    expect(screen.getByLabelText('Pool selection')).toHaveTextContent(/^active$/)
    expect(screen.getByLabelText('Portfolio selection')).toHaveTextContent(/^inactive$/)
  })

  it('should make Portfolio active on create-position pages with a Portfolio Pools entry point', () => {
    window.history.pushState(
      {},
      '',
      `/positions/add/new?${new URLSearchParams({ entryPoint: '/portfolio/pools' }).toString()}`,
    )

    expect(getTabState(ElementName.NavbarPoolTab)).toBe(false)
    expect(getTabState(ElementName.NavbarPortfolioTab)).toBe(true)
  })

  it('should make Portfolio active from a location state Portfolio Pools entry point', () => {
    window.history.pushState({ usr: { entryPoint: '/portfolio/pools' } }, '', '/positions/add/new')

    expect(getTabState(ElementName.NavbarPoolTab)).toBe(false)
    expect(getTabState(ElementName.NavbarPortfolioTab)).toBe(true)
  })

  it('should keep Pool active when the Portfolio Pools entry point is malformed', () => {
    window.history.pushState(
      {},
      '',
      `/positions/add/new?${new URLSearchParams({ entryPoint: '//evil.com/portfolio/pools' }).toString()}`,
    )

    expect(getTabState(ElementName.NavbarPoolTab)).toBe(true)
    expect(getTabState(ElementName.NavbarPortfolioTab)).toBe(false)
  })

  it('should keep Pool active when the Portfolio Pools entry point has an invalid address segment', () => {
    window.history.pushState(
      {},
      '',
      `/positions/add/new?${new URLSearchParams({ entryPoint: '/portfolio/not-an-address/pools' }).toString()}`,
    )

    expect(getTabState(ElementName.NavbarPoolTab)).toBe(true)
    expect(getTabState(ElementName.NavbarPortfolioTab)).toBe(false)
  })
})
