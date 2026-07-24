import { HomeScreenPortfolio } from 'src/screens/HomeScreen/portfolio/HomeScreenPortfolio'
import { useHomeScreenState } from 'src/screens/HomeScreen/useHomeScreenState'
import { render, screen } from 'src/test/test-utils'
import { usePoolsTabVisibility } from 'uniswap/src/features/positions/hooks/usePoolsTabVisibility'
import type { MockedFunction } from 'vitest'

const noop = (): void => undefined

const EMPTY_STATE_TEST_ID = 'empty-wallet-tokens-tab'
const TAB_VIEW_TEST_ID = 'tab-view-body'

// Stub the two mutually-exclusive outcomes so the test asserts purely on which branch renders.
vi.mock('src/screens/HomeScreen/portfolio/tabs/tokens/empty/EmptyWalletTokensTab', async () => {
  const { Text } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    EmptyWalletTokensTab: () => <Text testID="empty-wallet-tokens-tab">empty</Text>,
  }
})
vi.mock('src/screens/HomeScreen/portfolio/tabs/common/TabViewBody', async () => {
  const { Text } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    TabViewBody: () => <Text testID="tab-view-body">tabs</Text>,
  }
})

// Header chrome is irrelevant to the empty-state branch; stub to avoid its dependency surface.
vi.mock('src/screens/HomeScreen/portfolio/feedScroll/HomeScreenPortfolioStickyTabBar', () => ({
  HomeScreenPortfolioStickyTabBar: () => null,
}))
vi.mock('src/screens/HomeScreen/portfolio/feedScroll/HomeScreenPortfolioStatusBar', () => ({
  HomeScreenPortfolioStatusBar: () => null,
}))
vi.mock('src/components/layout/Screen', async () => {
  const { View } = await vi.importActual<{ View: React.ComponentType<{ children?: React.ReactNode }> }>('react-native')
  return { Screen: ({ children }: { children: React.ReactNode }) => <View>{children}</View> }
})
vi.mock('@shopify/react-native-performance-navigation', () => ({
  ReactNavigationPerformanceView: ({ children }: { children: React.ReactNode }) => children,
}))

// Inputs under test.
vi.mock('src/screens/HomeScreen/useHomeScreenState', () => ({
  useHomeScreenState: vi.fn(),
}))
vi.mock('uniswap/src/features/positions/hooks/usePoolsTabVisibility', () => ({
  usePoolsTabVisibility: vi.fn(),
}))

// Peripheral hooks — return minimal stable values so the component renders.
vi.mock('src/features/splashScreen/useHideSplashScreen', () => ({
  useHideSplashScreen: () => (): void => undefined,
}))
vi.mock('wallet/src/features/wallet/hooks', async () => ({
  ...(await vi.importActual('wallet/src/features/wallet/hooks')),
  useActiveAccountWithThrow: () => ({ address: '0x0000000000000000000000000000000000000001' }),
}))
vi.mock('src/screens/HomeScreen/portfolio/header/useHomeScreenPortfolioHeader', () => ({
  useHomeScreenPortfolioHeader: () => ({ header: null, outageModal: null }),
}))
vi.mock('src/screens/HomeScreen/portfolio/hooks/useHomeScreenPortfolioRefresh', () => ({
  useHomeScreenPortfolioRefresh: () => ({ refreshing: false, onRefresh: (): void => undefined }),
}))
vi.mock('src/screens/HomeScreen/portfolio/context/HomeScreenPortfolioScrollContext', async () => {
  // use the mocked reanimated makeMutable (the real package can't load under vitest/node)
  const { makeMutable } = await import('react-native-reanimated')
  return {
    useHomeScreenPortfolioScroll: () => ({
      feedScrollValue: makeMutable(0),
      feedScrollHandler: (): void => undefined,
      feedScrollRef: { current: null },
    }),
  }
})
vi.mock('src/screens/HomeScreen/portfolio/tabs/common/hooks/useHomeScreenPortfolioTabState', () => ({
  useHomeScreenPortfolioTabState: () => ({ tabIndex: 0, onTabIndexChange: (): void => undefined }),
}))
vi.mock('uniswap/src/components/nfts/hooks/useNftListRenderData', () => ({
  useNftListRenderData: () => ({ onListEndReached: (): void => undefined, numShown: 0, numHidden: 0 }),
}))
vi.mock('src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData', () => ({
  usePoolsListRenderData: () => ({ onListEndReached: (): void => undefined }),
}))

const mockUseHomeScreenState = useHomeScreenState as MockedFunction<typeof useHomeScreenState>
const mockUsePoolsTabVisibility = usePoolsTabVisibility as MockedFunction<typeof usePoolsTabVisibility>

const setup = ({
  hasNoWalletActivity,
  shouldShowPoolsTab,
}: {
  hasNoWalletActivity: boolean
  shouldShowPoolsTab: boolean
}): void => {
  mockUseHomeScreenState.mockReturnValue({ showEmptyWalletState: hasNoWalletActivity } as ReturnType<
    typeof useHomeScreenState
  >)
  mockUsePoolsTabVisibility.mockReturnValue({ shouldShowPoolsTab, openPoolPositionsCount: 0 })
  render(<HomeScreenPortfolio isLayoutReady={false} setIsLayoutReady={noop} />)
}

describe('HomeScreenPortfolio empty-state gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not show the empty state for a pools-only wallet (no tokens/NFTs/activity)', () => {
    // The edge case: useHomeScreenState reports "empty", but the wallet has pool positions.
    setup({ hasNoWalletActivity: true, shouldShowPoolsTab: true })

    expect(screen.queryByTestId(EMPTY_STATE_TEST_ID)).toBeNull()
    expect(screen.getByTestId(TAB_VIEW_TEST_ID)).toBeDefined()
  })

  it('shows the empty state for a truly empty wallet (no tokens/NFTs/activity and no pools)', () => {
    setup({ hasNoWalletActivity: true, shouldShowPoolsTab: false })

    expect(screen.getByTestId(EMPTY_STATE_TEST_ID)).toBeDefined()
    expect(screen.queryByTestId(TAB_VIEW_TEST_ID)).toBeNull()
  })

  it('shows the tabs for a funded wallet regardless of pools', () => {
    setup({ hasNoWalletActivity: false, shouldShowPoolsTab: false })

    expect(screen.queryByTestId(EMPTY_STATE_TEST_ID)).toBeNull()
    expect(screen.getByTestId(TAB_VIEW_TEST_ID)).toBeDefined()
  })
})
