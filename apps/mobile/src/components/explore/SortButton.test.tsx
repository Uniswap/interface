import { SortButton } from 'src/components/explore/SortButton'
import { render } from 'src/test/test-utils'
import { TokenSortableField } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ClientTokensOrderBy } from 'wallet/src/features/wallet/types'

jest.mock('react-native-context-menu-view', () => {
  // Use the actual implementation of `react-native-context-menu-view` as the mock implementation
  // (we use mock just to get the props of the component in test)
  return jest.fn(jest.requireActual('react-native-context-menu-view').default)
})

describe('SortButton', () => {
  it('renders without error', () => {
    const tree = render(<SortButton orderBy={TokenSortableField.Volume} />)

    expect(tree).toMatchSnapshot()
  })

  const cases = [
    { test: 'volume', orderBy: TokenSortableField.Volume, label: 'Volume' },
    { test: 'total value locked', orderBy: TokenSortableField.TotalValueLocked, label: 'TVL' },
    { test: 'market cap', orderBy: TokenSortableField.MarketCap, label: 'Market cap' },
    {
      test: 'price increase',
      orderBy: ClientTokensOrderBy.PriceChangePercentage24hDesc,
      label: 'Price increase',
    },
    {
      test: 'price decrease',
      orderBy: ClientTokensOrderBy.PriceChangePercentage24hAsc,
      label: 'Price decrease',
    },
  ]

  describe.each(cases)('when ordering by $test', ({ orderBy, label }) => {
    it(`renders ${label} as the selected option`, () => {
      const { queryByText } = render(<SortButton orderBy={orderBy} />)
      const selectedOption = queryByText(label)

      expect(selectedOption).toBeTruthy()
    })
  })
})
