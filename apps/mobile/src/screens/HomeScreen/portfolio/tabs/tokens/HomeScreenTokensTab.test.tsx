import { makeMutable } from 'react-native-reanimated'
import { HomeScreenTokensTab } from 'src/screens/HomeScreen/portfolio/tabs/tokens/HomeScreenTokensTab'
import { getFiberPropChain, render, screen } from 'src/test/test-utils'

const mocks = vi.hoisted(() => ({ emptyTokensListProps: vi.fn() }))

vi.mock('uniswap/src/components/portfolio/EmptyTokensList', async () => {
  const { Text } = await vi.importActual<typeof import('@universe/mycelium')>('@universe/mycelium')
  return {
    EmptyTokensList: (props: Record<string, unknown>): JSX.Element => {
      mocks.emptyTokensListProps(props)
      return <Text testID="empty-tokens-list">loading</Text>
    },
  }
})

vi.mock('src/components/TokenBalanceList/TokenBalanceList', () => ({
  TokenBalanceItemRow: (): null => null,
}))

vi.mock('src/screens/HomeScreen/portfolio/tabs/tokens/empty/WalletPortfolioEmptyState', () => ({
  WalletPortfolioEmptyState: (): null => null,
}))

vi.mock('uniswap/src/features/portfolio/TokenBalanceListContext', () => ({
  useTokenBalanceListContext: (): Record<string, unknown> => ({
    rows: [],
    balancesById: undefined,
    isError: false,
    isPortfolioBalancesLoading: true,
    refetch: undefined,
  }),
}))

function renderTab(): void {
  render(
    <HomeScreenTokensTab
      feedScrollValue={makeMutable(0)}
      viewportHeight={800}
      bodyOffsetY={0}
      onHeightChange={(): void => undefined}
    />,
  )
}

describe('HomeScreenTokensTab', () => {
  beforeEach(() => {
    mocks.emptyTokensListProps.mockClear()
  })

  // TokenBalanceItem rows carry their own 24px gutter, so any inset around the loading list
  // makes the skeleton narrower than the rows it stands in for.
  it('does not add horizontal padding around the token list loading state', () => {
    renderTab()

    const marker = screen.getByTestId('empty-tokens-list')
    expect(getFiberPropChain(marker, 'px')).toEqual([])
    expect(getFiberPropChain(marker, 'paddingHorizontal')).toEqual([])
  })

  it('keeps the error card inset to the screen gutter', () => {
    renderTab()

    expect(mocks.emptyTokensListProps).toHaveBeenCalledWith(
      expect.objectContaining({ errorCardContainerStyle: { pt: '$spacing24', px: '$spacing24' } }),
    )
  })
})
