import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { MARGIN_POSITION_ACTIVITY_WIRE_DECREASED } from 'uniswap/src/data/apiClients/tradingApi/__fixtures__/marginPositionActivityWire'
import { MARGIN_POSITIONS_WIRE_PNL_ACTIVE } from 'uniswap/src/data/apiClients/tradingApi/__fixtures__/marginPositionsWirePnl'
import { type MarginActivePosition, MarginApiClient } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  toMarginPositionActivityView,
  toMarginPositionsView,
} from 'uniswap/src/data/apiClients/tradingApi/marginPositionsView'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isMarginActivePosition } from '~/features/margin/utils/marginPositionRow'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { type MarginDrawerColumn, MarginPositionDrawer } from '~/pages/Swap/Margin/components/MarginPositionDrawer'
import { MARGIN_ACTIVE_COLUMN } from '~/pages/Swap/Margin/marginTableConstants'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket()

// The drawer renders a market-missing notice instead of its figures, so every case pins the market.
vi.mock('~/features/margin/hooks/useResolveMarginMarket', () => ({
  useResolveMarginMarketForPosition: () => MARKET,
}))

// Every Active column, in the table's order, as the row above the drawer lays them out.
const COLUMNS: MarginDrawerColumn[] = Object.values(MARGIN_ACTIVE_COLUMN).map((id) => ({ id, style: { width: 100 } }))

// A served Morpho long as the table receives it: 2.521674 USDC borrowed at 4.81%, 0.002362 USDC of
// interest so far, opened with 0.002 WETH of collateral on 0.001 WETH deposited.
function wireMorphoRow(): MarginActivePosition {
  return toMarginPositionsView(MARGIN_POSITIONS_WIRE_PNL_ACTIVE).positions.filter(isMarginActivePosition)[0]
}

// The drawer cell a figure renders in, and that cell's width. The first sized element is the (empty) pair
// cell, so its parent is the drawer's column row.
function cellOf(element: HTMLElement): { index: number; width: string } {
  const row = document.querySelector<HTMLElement>('[style*="width:"]')?.parentElement
  const cells = Array.from(row?.children ?? []).filter((cell): cell is HTMLElement => cell instanceof HTMLElement)
  const index = cells.findIndex((cell) => cell.contains(element))
  return { index, width: cells[index]?.style.width ?? '' }
}

describe('MarginPositionDrawer', () => {
  // Borrowing takes the mark/entry and PnL columns as one slot, so the columns after it shift by one.
  it('lays borrowing under mark/entry and PnL, interest under liq. price, leverage at open under margin', () => {
    render(<MarginPositionDrawer position={wireMorphoRow()} columns={COLUMNS} />)
    expect(cellOf(screen.getByText('Borrowing'))).toEqual({ index: 1, width: '200px' })
    expect(cellOf(screen.getByText('Interest accrued'))).toEqual({ index: 2, width: '100px' })
    expect(cellOf(screen.getByText('Leverage at open'))).toEqual({ index: 4, width: '100px' })
  })

  it('keeps each figure label on one line', () => {
    render(<MarginPositionDrawer position={wireMorphoRow()} columns={COLUMNS} />)
    for (const label of ['Borrowing', 'Interest accrued', 'Leverage at open']) {
      expect(screen.getByText(label)).toHaveClass('whitespace-nowrap')
    }
  })

  it('keeps every column separate when the row hands over no PnL column to span', () => {
    const withoutPnl = COLUMNS.filter((column) => column.id !== MARGIN_ACTIVE_COLUMN.pnl)
    render(<MarginPositionDrawer position={wireMorphoRow()} columns={withoutPnl} />)
    expect(cellOf(screen.getByText('Borrowing'))).toEqual({ index: 1, width: '100px' })
  })

  // Add, Withdraw, Change leverage and Close live in the row's `…` menu; the drawer repeats none of them.
  it('renders no management actions', () => {
    render(<MarginPositionDrawer position={wireMorphoRow()} columns={COLUMNS} />)
    for (const label of ['Add margin', 'Withdraw margin', 'Change leverage', 'Close position', 'Position actions']) {
      expect(screen.queryByLabelText(label)).not.toBeInTheDocument()
    }
  })

  it('reads the borrowing line, interest and leverage at open off a served row', () => {
    render(<MarginPositionDrawer position={wireMorphoRow()} columns={COLUMNS} />)
    expect(screen.getByText('2.52 USDC')).toBeInTheDocument()
    expect(screen.getByText(/^Morpho · \d+% LLTV$/)).toBeInTheDocument()
    expect(screen.getByText('4.8%')).toBeInTheDocument()
    expect(screen.getByText('0.002 USDC')).toBeInTheDocument()
    expect(screen.getByText('2.00x')).toBeInTheDocument()
  })

  // The box this replaced: none of its rows, nor the meta line under it, survive.
  it('carries no PnL breakdown and no entry / opened / sub-account line', () => {
    render(<MarginPositionDrawer position={{ ...wireMorphoRow(), costBasisUsd: '2516947' }} columns={COLUMNS} />)
    for (const label of ['Margin at cost', 'Margin now', 'Unrealized PnL', 'Break-even', 'Sub-account', 'Opened']) {
      expect(screen.queryByText(new RegExp(label))).not.toBeInTheDocument()
    }
  })

  it('dashes interest and leverage at open where the wire carries neither', () => {
    render(
      <MarginPositionDrawer
        position={{ ...wireMorphoRow(), accruedInterest: undefined, depositedEquity: undefined, openedLeverage: '0' }}
        columns={COLUMNS}
      />,
    )
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('omits the borrow rate rather than printing an empty one', () => {
    render(<MarginPositionDrawer position={{ ...wireMorphoRow(), borrowRate: undefined }} columns={COLUMNS} />)
    expect(screen.getByText('2.52 USDC')).toBeInTheDocument()
    expect(screen.queryByText(/^\d+\.\d%$/)).not.toBeInTheDocument()
  })

  it('reads a stamped openedLeverage over the derived ratio', () => {
    render(<MarginPositionDrawer position={{ ...wireMorphoRow(), openedLeverage: '2.4' }} columns={COLUMNS} />)
    expect(screen.getByText('2.40x')).toBeInTheDocument()
  })

  it('warns near liquidation', () => {
    render(
      <MarginPositionDrawer position={{ ...wireMorphoRow(), healthFactor: '1050000000000000000' }} columns={COLUMNS} />,
    )
    expect(screen.getByText(/close to liquidation/i)).toBeInTheDocument()
  })

  describe('partial decreases, from the position’s activity', () => {
    const ACTIVITY_ID = '0xe46e3d4677aa8b9e32efd10fff8e84d93bb414bd2d54f5bb19b9541beffe6e01'

    afterEach(() => {
      vi.restoreAllMocks()
    })

    // A client of its own, without retries, so a failed read settles inside the test.
    function renderDrawer(position: MarginActivePosition): QueryClient {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      render(
        <QueryClientProvider client={client}>
          <MarginPositionDrawer position={position} columns={COLUMNS} />
        </QueryClientProvider>,
      )
      return client
    }

    it('lists each decrease with the debt repaid, collateral sold and fill price, and nothing for the other events', async () => {
      const fetchActivity = vi
        .spyOn(MarginApiClient, 'fetchMarginPositionActivity')
        .mockResolvedValue(toMarginPositionActivityView([MARGIN_POSITION_ACTIVITY_WIRE_DECREASED]))
      renderDrawer({ ...wireMorphoRow(), activityId: ACTIVITY_ID })
      expect(await screen.findByText('Reduced — repaid 2.71 USDC · sold 0.001 ETH @ $2,376.85')).toBeInTheDocument()
      expect(screen.getAllByText(/^Reduced/)).toHaveLength(1)
      expect(fetchActivity).toHaveBeenCalledWith({ activityId: ACTIVITY_ID })
    })

    it('dashes the price of a decrease that carries no fill', async () => {
      const unpriced = toMarginPositionActivityView([MARGIN_POSITION_ACTIVITY_WIRE_DECREASED]).map((event) => ({
        ...event,
        price: undefined,
      }))
      vi.spyOn(MarginApiClient, 'fetchMarginPositionActivity').mockResolvedValue(unpriced)
      renderDrawer({ ...wireMorphoRow(), activityId: ACTIVITY_ID })
      expect(await screen.findByText('Reduced — repaid 2.71 USDC · sold 0.001 ETH @ —')).toBeInTheDocument()
    })

    it('still renders the drawer, without decrease lines, when the activity read fails', async () => {
      vi.spyOn(MarginApiClient, 'fetchMarginPositionActivity').mockRejectedValue(new Error('upstream 503'))
      const client = renderDrawer({ ...wireMorphoRow(), activityId: ACTIVITY_ID })
      await waitFor(() =>
        expect(
          client
            .getQueryCache()
            .getAll()
            .map((query) => query.state.status),
        ).toEqual(['error']),
      )
      expect(screen.getByText('Borrowing')).toBeInTheDocument()
      expect(screen.getByText('2.52 USDC')).toBeInTheDocument()
      expect(screen.queryByText(/^Reduced/)).not.toBeInTheDocument()
    })

    it('does not ask for activity a row has no activityId for', () => {
      const fetchActivity = vi.spyOn(MarginApiClient, 'fetchMarginPositionActivity')
      renderDrawer(wireMorphoRow())
      expect(screen.getByText('Borrowing')).toBeInTheDocument()
      expect(fetchActivity).not.toHaveBeenCalled()
    })
  })
})
