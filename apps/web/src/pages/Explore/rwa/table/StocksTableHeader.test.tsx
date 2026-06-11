import { OrderDirection } from '~/appGraphql/data/util'
import { StocksTableHeader } from '~/pages/Explore/rwa/table/StocksTableHeader'
import {
  StocksSortMethod,
  StocksTableSortStoreContextProvider,
  useStocksTableSortSelection,
} from '~/pages/Explore/rwa/table/stocksTableSortStore'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

function SortSelectionProbe(): JSX.Element {
  const { sortMethod, sortAscending } = useStocksTableSortSelection()

  return <div data-testid="sort-selection">{`${sortMethod}:${sortAscending ? 'asc' : 'desc'}`}</div>
}

function renderHeader(): void {
  render(
    <StocksTableSortStoreContextProvider>
      <StocksTableHeader
        category={StocksSortMethod.PRICE}
        isCurrentSortMethod={false}
        direction={OrderDirection.Desc}
      />
      <SortSelectionProbe />
    </StocksTableSortStoreContextProvider>,
  )
}

describe('StocksTableHeader', () => {
  it('sorts when clicking the header while its tooltip is mounted', async () => {
    renderHeader()

    const headerText = screen.getByText('Price')
    fireEvent.mouseEnter(headerText)
    await waitFor(() => expect(screen.getByText(/highest-volume network/i)).toBeVisible())

    fireEvent.click(headerText)

    await waitFor(() => expect(screen.getByTestId('sort-selection')).toHaveTextContent('Price:desc'))
  })

  it('sorts when clicking the mounted tooltip content', async () => {
    renderHeader()

    fireEvent.mouseEnter(screen.getByText('Price'))
    const tooltipContent = screen.getByText(/highest-volume network/i)
    await waitFor(() => expect(tooltipContent).toBeVisible())

    fireEvent.click(tooltipContent)

    await waitFor(() => expect(screen.getByTestId('sort-selection')).toHaveTextContent('Price:desc'))
  })
})
