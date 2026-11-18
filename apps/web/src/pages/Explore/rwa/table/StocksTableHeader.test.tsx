import { OrderDirection } from '~/data/util'
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

function renderHeader(category = StocksSortMethod.PRICE): void {
  render(
    <StocksTableSortStoreContextProvider>
      <StocksTableHeader category={category} isCurrentSortMethod={false} direction={OrderDirection.Desc} />
      <SortSelectionProbe />
    </StocksTableSortStoreContextProvider>,
  )
}

const FDV_TOOLTIP =
  'Fully diluted valuation (FDV) calculates the total market value assuming all tokens are in circulation.'
const VOLUME_TOOLTIP =
  'Volume is the amount of the asset that has been traded on Uniswap or within the Solana ecosystem during the selected timeframe.'

describe('StocksTableHeader', () => {
  it('leaves the timeframe out of the volume label, since the selector owns it', () => {
    renderHeader(StocksSortMethod.VOLUME)

    expect(screen.getByText('Volume')).toBeVisible()
  })

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

  it.each<[StocksSortMethod, string, string]>([
    [StocksSortMethod.FDV, 'FDV', FDV_TOOLTIP],
    [StocksSortMethod.VOLUME, 'Volume', VOLUME_TOOLTIP],
  ])('shows the %s tooltip', async (category, label, tooltipPattern) => {
    renderHeader(category)

    fireEvent.mouseEnter(screen.getByText(label))

    await waitFor(() => expect(screen.getByText(tooltipPattern)).toBeVisible())
  })
})
