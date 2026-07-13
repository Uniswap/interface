import { HomeScreenPortfolio } from 'src/screens/HomeScreen/portfolio/HomeScreenPortfolio'
import { useHomeScreenState } from 'src/screens/HomeScreen/useHomeScreenState'
import { render, screen } from 'src/test/test-utils'
import { usePoolsTabVisibility } from 'uniswap/src/features/positions/hooks/usePoolsTabVisibility'

const noop = (): void => undefined

const EMPTY_STATE_TEST_ID = 'empty-wallet-tokens-tab'
const TAB_VIEW_TEST_ID = 'tab-view-body'

// Stub the two mutually-exclusive outcomes so the test asserts purely on which branch renders.
jest.mock('src/screens/HomeScreen/portfolio/tabs/tokens/empty/EmptyWalletTokensTab', () => ({
  EmptyWalletTokensTab: () => {
    const { Text } = jest.requireActual('ui/src')
    return <Text testID="empty-wallet-tokens-tab">empty</Text>
  },
}))
jest.mock('src/screens/HomeScreen/portfolio/tabs/common/TabViewBody', () => ({
  TabViewBody: () => {
    const { Text } = jest.requireActual('ui/src')
    return <Text testID="tab-view-body">tabs</Text>
  },
}))

// Header chrome is irrelevant to the empty-state branch; stub to avoid its dependency surface.
jest.mock('src/screens/HomeScreen/portfolio/feedScroll/HomeScreenPortfolioStickyTabBar', () => ({
  HomeScreenPortfolioStickyTabBar: () => null,
}))
jest.mock('src/screens/HomeScreen/portfolio/feedScroll/HomeScreenPortfolioStatusBar', () => ({
  HomeScreenPortfolioStatusBar: () => null,
}))
jest.mock('src/components/layout/Screen', () => {
  const { View } = jest.requireActual('react-native')
  return { Screen: ({ children }: { children: React.ReactNode }) => <View>{children}</View> }
})
jest.mock('@shopify/react-native-performance-navigation', () => ({
  ReactNavigationPerformanceView: ({ children }: { children: React.ReactNode }) => children,
}))

// Inputs under test.
jest.mock('src/screens/HomeScreen/useHomeScreenState', () => ({
  useHomeScreenState: jest.fn(),
}))
jest.mock('uniswap/src/features/positions/hooks/usePoolsTabVisibility', () => ({
  usePoolsTabVisibility: jest.fn(),
}))

// Peripheral hooks — return minimal stable values so the component renders.
jest.mock('src/features/splashScreen/useHideSplashScreen', () => ({
  useHideSplashScreen: () => (): void => undefined,
}))
jest.mock('wallet/src/features/wallet/hooks', () => ({
  ...jest.requireActual('wallet/src/features/wallet/hooks'),
  useActiveAccountWithThrow: () => ({ address: '0x0000000000000000000000000000000000000001' }),
}))
jest.mock('src/screens/HomeScreen/portfolio/header/useHomeScreenPortfolioHeader', () => ({
  useHomeScreenPortfolioHeader: () => ({ header: null, shouldShowWrappedBanner: false, outageModal: null }),
}))
jest.mock('src/screens/HomeScreen/portfolio/hooks/useHomeScreenPortfolioRefresh', () => ({
  useHomeScreenPortfolioRefresh: () => ({ refreshing: false, onRefresh: (): void => undefined }),
}))
jest.mock('src/screens/HomeScreen/portfolio/context/HomeScreenPortfolioScrollContext', () => {
  const { makeMutable: makeMutableActual } = jest.requireActual('react-native-reanimated')
  return {
    useHomeScreenPortfolioScroll: () => ({
      feedScrollValue: makeMutableActual(0),
      feedScrollHandler: (): void => undefined,
      feedScrollRef: { current: null },
    }),
  }
})
jest.mock('src/screens/HomeScreen/portfolio/tabs/common/hooks/useHomeScreenPortfolioTabState', () => ({
  useHomeScreenPortfolioTabState: () => ({ tabIndex: 0, onTabIndexChange: (): void => undefined }),
}))
jest.mock('uniswap/src/components/nfts/hooks/useNftListRenderData', () => ({
  useNftListRenderData: () => ({ onListEndReached: (): void => undefined, numShown: 0, numHidden: 0 }),
}))
jest.mock('src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData', () => ({
  usePoolsListRenderData: () => ({ onListEndReached: (): void => undefined }),
}))

const mockUseHomeScreenState = useHomeScreenState as jest.MockedFunction<typeof useHomeScreenState>
const mockUsePoolsTabVisibility = usePoolsTabVisibility as jest.MockedFunction<typeof usePoolsTabVisibility>

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
    jest.clearAllMocks()
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
