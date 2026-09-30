import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { OrderDirection } from '~/data/util'
import { StocksTableHeader } from '~/pages/Explore/rwa/table/StocksTableHeader'
import {
  StocksSortMethod,
  StocksTableSortStoreContextProvider,
  useStocksTableSortSelection,
} from '~/pages/Explore/rwa/table/stocksTableSortStore'
import { mocked } from '~/test-utils/mocked'
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

const MARKET_CAP_TOOLTIP =
  'Market capitalization is the total market value of an asset’s circulating supply across multiple exchanges.'
const VOLUME_TOOLTIP =
  'Volume is the total amount of the asset that has been traded on all networks across multiple major exchanges over the last 24 hours.'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: vi.fn(),
}))

describe('StocksTableHeader', () => {
  beforeEach(() => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(false)
  })

  it('labels the stocks volume column with its 1D timeframe', () => {
    renderHeader(StocksSortMethod.VOLUME)

    expect(screen.getByText('1D Volume')).toBeVisible()
  })

  it('drops the timeframe from the volume label when the selector is available', () => {
    mocked(useIsTokenCategoriesEnabled).mockReturnValue(true)

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
    [StocksSortMethod.MARKET_CAP, 'Market cap', MARKET_CAP_TOOLTIP],
    [StocksSortMethod.VOLUME, '1D Volume', VOLUME_TOOLTIP],
  ])('shows the %s tooltip', async (category, label, tooltipPattern) => {
    renderHeader(category)

    fireEvent.mouseEnter(screen.getByText(label))

    await waitFor(() => expect(screen.getByText(tooltipPattern)).toBeVisible())
  })
})
