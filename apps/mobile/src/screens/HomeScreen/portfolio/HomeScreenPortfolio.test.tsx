import { HomeScreenPortfolio } from 'src/screens/HomeScreen/portfolio/HomeScreenPortfolio'
import { useHomeScreenState } from 'src/screens/HomeScreen/useHomeScreenState'
import { render, screen } from 'src/test/test-utils'
import { usePoolsTabVisibility } from 'uniswap/src/features/positions/hooks/usePoolsTabVisibility'
import { noop } from 'utilities/src/react/noop'
import type { MockedFunction } from 'vitest'

const EMPTY_STATE_TEST_ID = 'empty-wallet-tokens-tab'
const TAB_VIEW_TEST_ID = 'tab-view-body'
const mockUseHomeScreenPortfolioHeader = vi.hoisted(() =>
  vi.fn(
    (_props: {
      earnCardExpansionRequestId?: number
      onEarnCardExpansionRequestHandled: (requestId: number) => void
    }) => ({ header: null, outageModal: null }),
  ),
)
const mockScrollToOffset = vi.hoisted(() => vi.fn())
const mockUseRoute = vi.hoisted(() => vi.fn())
const mockSetParams = vi.hoisted(() => vi.fn())

vi.mock('@react-navigation/native', async () => ({
  ...(await vi.importActual('@react-navigation/native')),
  useNavigation: () => ({ setParams: mockSetParams }),
  useRoute: mockUseRoute,
}))

// Stub the two mutually-exclusive outcomes so the test asserts purely on which branch renders.
vi.mock('src/screens/HomeScreen/portfolio/tabs/tokens/empty/EmptyWalletTokensTab', async () => {
  const { Text } = await vi.importActual<typeof import('@universe/mycelium')>('@universe/mycelium')
  return {
    EmptyWalletTokensTab: () => <Text testID="empty-wallet-tokens-tab">empty</Text>,
  }
})
vi.mock('src/screens/HomeScreen/portfolio/tabs/common/TabViewBody', async () => {
  const { Text } = await vi.importActual<typeof import('@universe/mycelium')>('@universe/mycelium')
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
  useHomeScreenPortfolioHeader: mockUseHomeScreenPortfolioHeader,
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
  earnCardExpansionRequestId,
  hasNoWalletActivity,
  shouldShowPoolsTab,
}: {
  earnCardExpansionRequestId?: number
  hasNoWalletActivity: boolean
  shouldShowPoolsTab: boolean
}): void => {
  mockUseHomeScreenState.mockReturnValue({ showEmptyWalletState: hasNoWalletActivity } as ReturnType<
    typeof useHomeScreenState
  >)
  mockUsePoolsTabVisibility.mockReturnValue({ shouldShowPoolsTab, openPoolPositionsCount: 0 })
  mockUseRoute.mockReturnValue({ params: { earnCardExpansionRequestId } })
  render(<HomeScreenPortfolio isLayoutReady={false} setIsLayoutReady={noop} />)
}

describe('HomeScreenPortfolio empty-state gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(HTMLElement.prototype, 'scrollToOffset', {
      configurable: true,
      value: mockScrollToOffset,
    })
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

  it('passes an Earn expansion request to the portfolio header', () => {
    setup({ earnCardExpansionRequestId: 42, hasNoWalletActivity: false, shouldShowPoolsTab: false })

    expect(mockUseHomeScreenPortfolioHeader).toHaveBeenCalledWith({
      earnCardExpansionRequestId: 42,
      onEarnCardExpansionRequestHandled: expect.any(Function),
    })
    expect(mockScrollToOffset).toHaveBeenCalledWith({ offset: 0, animated: true })
  })

  it('consumes only the handled Earn request so an account remount cannot replay it', () => {
    setup({ earnCardExpansionRequestId: 42, hasNoWalletActivity: false, shouldShowPoolsTab: false })

    const headerProps = mockUseHomeScreenPortfolioHeader.mock.lastCall?.[0]
    headerProps?.onEarnCardExpansionRequestHandled(41)
    expect(mockSetParams).not.toHaveBeenCalled()

    headerProps?.onEarnCardExpansionRequestHandled(42)
    expect(mockSetParams).toHaveBeenCalledWith({ earnCardExpansionRequestId: undefined })
  })
})
