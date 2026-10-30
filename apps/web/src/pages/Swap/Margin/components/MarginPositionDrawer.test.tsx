import { fireEvent, screen } from '@testing-library/react'
import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginPositionDrawer } from '~/pages/Swap/Margin/components/MarginPositionDrawer'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket()
const ACCOUNT = '0x000000000000000000000000000000000000000A'

const { mockUseIsPlanInFlight, mockIsTouchDevice } = vi.hoisted(() => ({
  mockUseIsPlanInFlight: vi.fn(() => false),
  mockIsTouchDevice: { current: false },
}))

// The drawer returns null when its market misses, so all cases would fail regardless of the row.
vi.mock('~/pages/Swap/Margin/hooks/useResolveMarginMarket', () => ({
  useResolveMarginMarketForPosition: () => MARKET,
}))

vi.mock('~/pages/Swap/Margin/hooks/useIsPlanInFlight', () => ({ useIsPlanInFlight: mockUseIsPlanInFlight }))

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useIsTouchDevice: () => mockIsTouchDevice.current,
}))

// '0' is the wire's unattributable-basis sentinel — the default position carries none, matching the
// old bare fixture (no costBasis at all).
const POSITION: MarginActivePosition = {
  positionId: '7',
  status: 'ACTIVE',
  direction: MarginDirection.LONG,
  exposureToken: { address: MARKET.collateral.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.collateral.decimals },
  counterToken: { address: MARKET.debt.address, chainId: MARGIN_CHAIN_ID, decimals: MARKET.debt.decimals },
  size: '2000000000000000000',
  entryPrice: '0',
  openedAt: '0',
  legs: [{ venue: 'MORPHO', subId: '7', account: ACCOUNT, debt: '2000000000' }],
  isTradable: true,
  equity: '2000000000',
  leverage: '2',
  oraclePrice: '2000000000000000000000',
  liquidationPrice: '1162790697674418604651',
  buffer: '400000000000000000',
  healthFactor: '1720000000000000000',
  maxWithdrawable: '500000000000000000',
}

// mycelium's Text compiles `color="$statusCritical"` to a uniwind arbitrary class such as
// `[color:var(--stext-statusCritical)]`; read the CSS var straight off that class.
function getDeclaredColorToken(element: HTMLElement): string | undefined {
  const colorClass = Array.from(element.classList).find((className) => className.startsWith('[color:var('))
  return colorClass?.match(/\[color:(var\(--[^)]+\))\]/)?.[1]
}

describe('MarginPositionDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsPlanInFlight.mockReturnValue(false)
    mockIsTouchDevice.current = false
  })

  it('renders one icon button per action', () => {
    render(<MarginPositionDrawer position={POSITION} onRequestModal={vi.fn()} />)
    for (const label of ['Add margin', 'Withdraw margin', 'Change leverage', 'Adjust position (advanced)']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Close position')).toBeInTheDocument()
  })

  it('requests the matching modal on press', () => {
    const onRequestModal = vi.fn()
    render(<MarginPositionDrawer position={POSITION} onRequestModal={onRequestModal} />)
    fireEvent.click(screen.getByLabelText('Withdraw margin'))
    // positionId, never the leg's on-chain account address: two positions can share the latter.
    expect(onRequestModal).toHaveBeenCalledWith({ action: 'withdraw', positionId: POSITION.positionId })
  })

  // IconButton marks its disabled state with aria-disabled, not the `disabled` attribute.
  it('disables every button and swallows the press when a plan is in flight', () => {
    mockUseIsPlanInFlight.mockReturnValue(true)
    const onRequestModal = vi.fn()
    render(<MarginPositionDrawer position={POSITION} onRequestModal={onRequestModal} />)
    for (const label of ['Add margin', 'Withdraw margin', 'Change leverage', 'Adjust position (advanced)']) {
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-disabled', 'true')
    }
    expect(screen.getByLabelText('Close position')).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(screen.getByLabelText('Add margin'))
    expect(onRequestModal).not.toHaveBeenCalled()
  })

  it('disables every button on a position with no subId', () => {
    const onRequestModal = vi.fn()
    render(
      <MarginPositionDrawer
        position={{ ...POSITION, legs: [{ venue: 'MORPHO', subId: '', account: ACCOUNT, debt: '2000000000' }] }}
        onRequestModal={onRequestModal}
      />,
    )
    // All five, not just the first: a gate applied to one button only would otherwise pass.
    for (const label of ['Add margin', 'Withdraw margin', 'Change leverage', 'Adjust position (advanced)']) {
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-disabled', 'true')
    }
    expect(screen.getByLabelText('Close position')).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(screen.getByLabelText('Close position'))
    expect(onRequestModal).not.toHaveBeenCalled()
  })

  // Hover tooltips do not exist on touch, so the icon row would be five unlabeled squares.
  it('falls back to the labeled menu on a touch device', () => {
    mockIsTouchDevice.current = true
    render(<MarginPositionDrawer position={POSITION} onRequestModal={vi.fn()} />)
    expect(screen.queryByLabelText('Add margin')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Position actions')).toBeInTheDocument()
  })

  // The row above the drawer now reports CURRENT leverage, so leverage at open needs a home — and an
  // explicit label, since an unlabeled figure beside it would read as the current one.
  describe('leverage at open', () => {
    const WITH_BASIS: MarginActivePosition = {
      ...POSITION,
      entryPrice: '1850000000000000000000',
      openedAt: '1753000000',
      openedLeverage: '2',
    }

    it('surfaces it as a labeled cell', () => {
      render(<MarginPositionDrawer position={WITH_BASIS} onRequestModal={vi.fn()} />)
      expect(screen.getByText('Leverage at open')).toBeInTheDocument()
      expect(screen.getByText('2.00x')).toBeInTheDocument()
    })

    // The cell is gated on `openedLeverage`, not on cost basis. Dropping only that field pins the
    // actual gate — using a fixture that also lacks entryPrice/openedAt would pass even if the gate
    // were keyed on either of those instead.
    it('omits the cell entirely for a position carrying no at-open leverage', () => {
      // '0' is the indexer's "never recorded" stamp and is not nullish, so an absent-only gate would
      // render a fabricated "0.00x" for it.
      for (const openedLeverage of [undefined, '0']) {
        const noOpenedLeverage: MarginActivePosition = { ...WITH_BASIS, openedLeverage }
        const { unmount } = render(<MarginPositionDrawer position={noOpenedLeverage} onRequestModal={vi.fn()} />)
        expect(screen.queryByText('Leverage at open')).not.toBeInTheDocument()
        expect(screen.queryByText('0.00x')).not.toBeInTheDocument()
        unmount()
      }
    })

    it('drops the entry line rather than reporting a $0 entry when no at-open mark was stamped', () => {
      const noMark: MarginActivePosition = { ...WITH_BASIS, entryPrice: '0' }
      render(<MarginPositionDrawer position={noMark} onRequestModal={vi.fn()} />)
      expect(screen.queryByText(/Entry/)).not.toBeInTheDocument()
      expect(screen.queryByText(/\$0\.00/)).not.toBeInTheDocument()
    })

    // The wire dropped costBasis.equityContributed; the open-time collateral/leverage pair determines
    // it — 2 WETH of collateral opened at 2x is 1 WETH of margin.
    it('recovers the equity contributed alongside the entry price', () => {
      const contributed: MarginActivePosition = { ...WITH_BASIS, collateralAtOpen: '2000000000000000000' }
      render(<MarginPositionDrawer position={contributed} onRequestModal={vi.fn()} />)
      expect(screen.getByText(/^Entry \$1,850\.\d\d$/)).toBeInTheDocument()
      expect(screen.getByText(/^Margin at open 1\.00 ETH$/)).toBeInTheDocument()
    })

    // A calendar date needs only openedAt — the last figure on this row still coupled to the entry price.
    it('keeps the opened-at date when no at-open mark was stamped', () => {
      const noMark: MarginActivePosition = { ...WITH_BASIS, entryPrice: '0' }
      render(<MarginPositionDrawer position={noMark} onRequestModal={vi.fn()} />)
      expect(screen.queryByText(/Entry/)).not.toBeInTheDocument()
      expect(screen.getByText(/^Opened /)).toBeInTheDocument()
    })

    // It derives from collateralAtOpen and the opened leverage, neither of which needs an at-open mark,
    // so the '0' entry-price sentinel must not take it down with the entry line.
    it('keeps the margin-at-open figure when no at-open mark was stamped', () => {
      const noMark: MarginActivePosition = {
        ...WITH_BASIS,
        entryPrice: '0',
        collateralAtOpen: '2000000000000000000',
      }
      render(<MarginPositionDrawer position={noMark} onRequestModal={vi.fn()} />)
      expect(screen.queryByText(/Entry/)).not.toBeInTheDocument()
      expect(screen.getByText(/^Margin at open 1\.00 ETH$/)).toBeInTheDocument()
    })

    // Nothing to recover from ⇒ the entry line stands alone; never a fabricated zero contribution.
    it('leaves the entry line bare where the indexer stamped no open-time collateral', () => {
      render(<MarginPositionDrawer position={WITH_BASIS} onRequestModal={vi.fn()} />)
      expect(screen.getByText(/^Entry \$1,850\.\d\d$/)).toBeInTheDocument()
      expect(screen.queryByText(/Margin at open/)).not.toBeInTheDocument()
    })
  })

  it('shows the PnL breakdown with a break-even row', () => {
    render(<MarginPositionDrawer position={{ ...POSITION, costBasisUsd: '25000000' }} onRequestModal={vi.fn()} />)
    expect(screen.getByText('Margin at cost')).toBeInTheDocument()
    expect(screen.getByText('Margin now')).toBeInTheDocument()
    expect(screen.getByText('Break-even')).toBeInTheDocument()
  })

  it('omits the whole block when the server has not valued the position', () => {
    render(<MarginPositionDrawer position={POSITION} onRequestModal={vi.fn()} />)
    expect(screen.queryByText('Margin at cost')).not.toBeInTheDocument()
  })

  // POSITION is a LONG (WETH collateral / USDC debt). marginUsdBreakEvenPrice divides a LONG by
  // COLLATERAL — `(costBasisUsd + debt) / collateral`, where collateral is `size` for a LONG (the
  // exposure leg) — so only an empty size leg suppresses it.
  it('omits break-even when the leg it divides by is empty', () => {
    render(
      <MarginPositionDrawer position={{ ...POSITION, costBasisUsd: '25000000', size: '0' }} onRequestModal={vi.fn()} />,
    )
    expect(screen.queryByText('Break-even')).not.toBeInTheDocument()
  })

  // Asserting only the row LABEL leaves the tone untested — flipping the positive/negative ternary
  // would paint gains red and losses green with the test still green. Read the declared colour.
  it('colours a losing unrealized figure critical, and a winning one success', () => {
    const losing = render(
      <MarginPositionDrawer
        position={{ ...POSITION, costBasisUsd: '25000000', oraclePrice: '1000000000000000000000' }}
        onRequestModal={vi.fn()}
      />,
    )
    expect(screen.getByText('Unrealized PnL')).toBeInTheDocument()
    const lossValue = screen.getByText(/^[-−]/)
    expect(getDeclaredColorToken(lossValue)).toBe('var(--stext-statusCritical)')
    losing.unmount()

    render(
      <MarginPositionDrawer
        position={{ ...POSITION, costBasisUsd: '25000000', oraclePrice: '5000000000000000000000' }}
        onRequestModal={vi.fn()}
      />,
    )
    const gainValue = screen.getByText(/^\+/)
    expect(getDeclaredColorToken(gainValue)).toBe('var(--stext-statusSuccess)')
  })

  it('lists each partial decrease with the debt repaid, collateral sold and exit price', () => {
    const withDecreases: MarginActivePosition = {
      ...POSITION,
      decreases: [
        {
          debtRepaid: '500000000',
          collateralSold: '250000000000000000',
          exitPrice: '2000000000000000000000',
          timestamp: '1753100000',
          txHash: '0xdec1',
        },
        { debtRepaid: '250000000', collateralSold: '100000000000000000', timestamp: '1753200000', txHash: '0xdec2' },
      ],
    }
    render(<MarginPositionDrawer position={withDecreases} onRequestModal={vi.fn()} />)
    expect(screen.getByText('Reduced — repaid 500.00 USDC · sold 0.250 ETH @ $2,000.00')).toBeInTheDocument()
    // A decrease that sold nothing has no exit price to report.
    expect(screen.getByText('Reduced — repaid 250.00 USDC · sold 0.100 ETH @ —')).toBeInTheDocument()
  })
})
