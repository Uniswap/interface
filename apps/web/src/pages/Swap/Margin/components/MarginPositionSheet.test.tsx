import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MarginMarket } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginPositionSheet } from '~/pages/Swap/Margin/components/MarginPositionSheet'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO

vi.mock('~/features/margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map(),
}))

// The chart pane has its own suite; this one checks the sheet charts the position's market, compactly.
vi.mock('~/pages/Swap/Margin/MarginChartPane', () => ({
  MarginChartPane: ({
    compact,
    pinnedMarket,
    focusedPosition,
  }: {
    compact?: boolean
    pinnedMarket?: MarginMarket
    focusedPosition?: MarginActivePosition
  }) => (
    <div
      data-testid="margin-chart-pane-stub"
      data-compact={String(compact)}
      data-market={pinnedMarket?.key}
      data-focus={focusedPosition?.positionId}
    />
  ),
}))

const POSITION: MarginActivePosition = {
  status: 'ACTIVE',
  positionId: 'pos-open-long',
  direction: MarginDirection.LONG,
  exposureToken: { address: MARKET.collateral.address, chainId: 1, decimals: MARKET.collateral.decimals },
  counterToken: { address: MARKET.debt.address, chainId: 1, decimals: MARKET.debt.decimals },
  size: '53000000000000000',
  entryPrice: '1850000000000000000000',
  // Thirteen days before the fixed clock below.
  openedAt: String(1_760_000_000 - 13 * 86_400),
  legs: [{ venue: MARKET.venue, subId: '7', account: '0x000000000000000000000000000000000000000A', debt: '71310000' }],
  isTradable: true,
  leverage: '2.3',
  oraclePrice: '1924000000000000000000',
  liquidationPrice: '1555930000000000000000',
  buffer: '0',
  healthFactor: '1237000000000000000',
  maxWithdrawable: '0',
  equity: '30662000',
}

const FIGURES = {
  pnl: <span>pnl-figure</span>,
  markEntry: <span>mark-entry-figure</span>,
  liqPrice: <span>liq-figure</span>,
  size: <span>size-figure</span>,
  margin: <span>margin-figure</span>,
}

function renderSheet(overrides: { market?: MarginMarket | undefined } = {}) {
  const onClose = vi.fn()
  const onRequestModal = vi.fn()
  render(
    <MarginPositionSheet
      isOpen
      onClose={onClose}
      position={POSITION}
      market={'market' in overrides ? overrides.market : MARKET}
      figures={FIGURES}
      onRequestModal={onRequestModal}
    />,
  )
  return { onClose, onRequestModal }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('MarginPositionSheet', () => {
  it('heads the sheet with the base symbol, direction and leverage, and the position’s age', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1_760_000_000 * 1000)
    renderSheet()
    const sheet = screen.getByTestId(TestID.MarginPositionSheet)
    expect(sheet).toHaveTextContent('ETH')
    expect(sheet).toHaveTextContent('Long 2.3x')
    expect(sheet).toHaveTextContent('13d')
  })

  it('charts the position’s own market in the compact pane, with this position in focus', () => {
    renderSheet()
    const chart = screen.getByTestId('margin-chart-pane-stub')
    expect(chart).toHaveAttribute('data-market', MARKET.key)
    expect(chart).toHaveAttribute('data-compact', 'true')
    expect(chart).toHaveAttribute('data-focus', POSITION.positionId)
  })

  it('lays out PnL and mark/entry, then liq. price, size and margin, under their labels', () => {
    renderSheet()
    const sheet = screen.getByTestId(TestID.MarginPositionSheet)
    for (const text of [
      'PnL',
      'pnl-figure',
      'Mark / Entry price',
      'mark-entry-figure',
      'Liq. price',
      'liq-figure',
      'Size',
      'size-figure',
      'Margin',
      'margin-figure',
    ]) {
      expect(sheet).toHaveTextContent(text)
    }
  })

  it('reveals the position actions under Modify, and hands a pick to the action modals after closing', () => {
    const { onClose, onRequestModal } = renderSheet()
    expect(screen.queryByText('Add margin')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId(TestID.MarginPositionSheetModify))
    expect(screen.getByText('Add margin')).toBeInTheDocument()
    expect(screen.getByText('Withdraw margin')).toBeInTheDocument()
    expect(screen.getByText('Close position')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Close position'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onRequestModal).toHaveBeenCalledWith({ action: 'close', positionId: POSITION.positionId })
  })

  it('closes from the header X', () => {
    const { onClose, onRequestModal } = renderSheet()
    fireEvent.click(screen.getByTestId(TestID.MarginPositionSheetClose))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onRequestModal).not.toHaveBeenCalled()
  })

  it('offers no chart and no actions for a position whose market cannot be resolved', () => {
    renderSheet({ market: undefined })
    expect(screen.queryByTestId('margin-chart-pane-stub')).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.MarginPositionSheetModify)).not.toBeInTheDocument()
    expect(screen.getByTestId(TestID.MarginPositionSheet)).toHaveTextContent('liq-figure')
  })
})
