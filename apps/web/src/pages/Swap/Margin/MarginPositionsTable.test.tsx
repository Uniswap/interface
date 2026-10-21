import { fireEvent, screen } from '@testing-library/react'
import { TestID } from '@universe/test'
import type {
  MarginActivePosition,
  MarginPositionsResponse,
  MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { shortenAddress } from 'utilities/src/addresses'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { MarginPositionsTable } from '~/pages/Swap/Margin/MarginPositionsTable'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO

const { mockAccountAddress, mockHistory, mockPositions, UNRESOLVED_COLLATERAL, UNRESOLVED_DEBT } = vi.hoisted(() => ({
  mockAccountAddress: '0x000000000000000000000000000000000000000A',
  // Per-test override for the history tab's rows; defaulted below, once CLOSED_SHORT exists.
  mockHistory: { current: [] as MarginTerminalPosition[] },
  // Per-test override for the active tab's OPEN position rows; empty by default.
  mockPositions: { current: [] as MarginActivePosition[] },
  // A pair the mocked market resolver below never resolves, for the unresolved-market fallback test.
  UNRESOLVED_COLLATERAL: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
  UNRESOLVED_DEBT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
}))

// AmountInput (pulled in transitively via MarginActionModals) imports react-native-localize, whose
// commonjs entry requires the real `react-native` package outside Vite's alias resolution.
vi.mock('react-native-localize', () => ({
  getNumberFormatSettings: () => ({ decimalSeparator: '.', groupingSeparator: ',' }),
}))

vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => ({ address: mockAccountAddress }),
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginMarkets', () => ({
  useMarginMarkets: () => ({
    groups: [],
    markets: [],
    getMarket: () => undefined,
    getLive: () => undefined,
    isLoading: false,
    error: undefined,
    dataUpdatedAt: 0,
    refetch: vi.fn(),
  }),
}))

// The mirror pair, MarginMarket's own SHORT convention: stable collateral, volatile debt.
const SHORT_MARKET = {
  ...MARKET,
  key: 'weth-usdc-morpho-short',
  displaySymbol: 'USDC',
  collateral: MARKET.debt,
  debt: MARKET.collateral,
  direction: 'SHORT',
} as typeof MARKET

function resolveMarketForTokens(tokens: { collateralToken: string; debtToken: string }): typeof MARKET | undefined {
  if (tokens.collateralToken === UNRESOLVED_COLLATERAL && tokens.debtToken === UNRESOLVED_DEBT) {
    return undefined
  }
  return tokens.collateralToken === MARKET.debt.address ? SHORT_MARKET : MARKET
}

vi.mock('~/pages/Swap/Margin/hooks/useResolveMarginMarket', () => ({
  useResolveMarginMarket: () => resolveMarketForTokens,
  useResolveMarginMarketForPosition: () => MARKET,
}))

vi.mock('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/pages/Swap/Margin/hooks/useMarginCurrencyInfos')>()),
  useMarginCurrencyInfos: () => new Map(),
}))

vi.mock('~/pages/Swap/Margin/hooks/useExecuteMarginPlan', () => ({
  useExecuteMarginPlan: () => ({
    executePlan: vi.fn(),
    resumePlan: vi.fn(),
    retryCurrentStep: vi.fn(),
    restartPlan: vi.fn(),
  }),
}))

vi.mock('uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore', () => ({
  useMarginFormStore: (selector: (s: { leverage: number }) => unknown) => selector({ leverage: 2 }),
}))

const CLOSED_SHORT: MarginTerminalPosition = {
  status: 'COMPLETED',
  positionId: 'pos-closed-short',
  direction: 'SHORT',
  exposureToken: { address: MARKET.collateral.address, chainId: 1, decimals: MARKET.collateral.decimals },
  counterToken: { address: MARKET.debt.address, chainId: 1, decimals: MARKET.debt.decimals },
  size: '2000000000000000000',
  entryPrice: '0',
  openedAt: '0',
  legs: [{ venue: MARKET.venue, subId: '7', account: mockAccountAddress, debt: '0' }],
  isTradable: true,
  closedAt: '1700000000',
  closeTxHash: '0xabc',
}
mockHistory.current = [CLOSED_SHORT]

// A pair the mocked resolver above never resolves — the fallback must never surface a raw wire string.
const UNRESOLVED_CLOSED: MarginTerminalPosition = {
  status: 'COMPLETED',
  positionId: 'pos-unresolved',
  direction: 'LONG',
  exposureToken: { address: UNRESOLVED_COLLATERAL, chainId: 1, decimals: 18 },
  counterToken: { address: UNRESOLVED_DEBT, chainId: 1, decimals: 6 },
  size: '53000000000000000', // 0.053
  entryPrice: '0',
  openedAt: '0',
  legs: [{ venue: 'MORPHO', subId: '1', account: mockAccountAddress, debt: '0' }],
  isTradable: true,
  closedAt: '1700000001',
  closeTxHash: '0xdef',
}

const POSITIONS_RESPONSE: MarginPositionsResponse = {
  requestId: 'req-1',
  positions: [],
  pendingPlans: [],
}

vi.mock('uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery', () => ({
  useMarginPositionsQuery: () => ({
    data: {
      ...POSITIONS_RESPONSE,
      // Terminal history is folded into positions[] now — the active + closed fixtures combine here.
      positions: [...mockPositions.current, ...mockHistory.current],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

// ltv 0.695 → 1/(1-0.695) = 3.2787x current, against 2x at open — the two must be distinguishable.
const OPEN_LONG: MarginActivePosition = {
  status: 'ACTIVE',
  positionId: 'pos-open-long',
  direction: 'LONG',
  exposureToken: { address: MARKET.collateral.address, chainId: 1, decimals: MARKET.collateral.decimals },
  counterToken: { address: MARKET.debt.address, chainId: 1, decimals: MARKET.debt.decimals },
  size: '53000000000000000', // 0.053 WETH
  entryPrice: '1850000000000000000000', // 1,850
  openedAt: '1753000000',
  legs: [{ venue: MARKET.venue, subId: '7', account: mockAccountAddress, debt: '71310000' }], // 71.31 USDC
  isTradable: true,
  // 1/(1−0.695): the balance sheet AND, for a long, the exposure.
  leverage: '3.278688524590164',
  oraclePrice: '1924000000000000000000', // 1,924
  liquidationPrice: '1555930000000000000000',
  buffer: '0',
  healthFactor: '1237000000000000000',
  maxWithdrawable: '0',
  openedLeverage: '2',
  equity: '30662000', // 0.053·1924 − 71.31, decorative for a LONG (never read off this field)
}

// 0.053 WETH held against 71.31 USDC of debt at a mark of 1,924, with $25 of margin at cost:
// equity is 0.053·1924 − 71.31 = $30.662, so PnL is +$5.66 on the basis, or +22.65%. The basis is
// deliberately NOT the token-count fallback ($37 worth of WETH at entry), so a regression onto the
// token basis fails.
const OPEN_LONG_VALUED: MarginActivePosition = { ...OPEN_LONG, costBasisUsd: '25000000' }

// Same 0.053 size as OPEN_LONG, on the pair the resolver above never resolves.
const UNRESOLVED_OPEN: MarginActivePosition = {
  ...OPEN_LONG,
  positionId: 'pos-unresolved-open',
  exposureToken: { address: UNRESOLVED_COLLATERAL, chainId: 1, decimals: 18 },
  counterToken: { address: UNRESOLVED_DEBT, chainId: 1, decimals: 6 },
}

// 4,000 USDC of collateral against 1 WETH of debt at a mark of 1,924, with $2,000 of margin at cost:
// equity is 4000 − 1924 = $2,076, so PnL is +$76 (+3.80%). Its exposure is the WETH it borrowed.
const OPEN_SHORT_VALUED: MarginActivePosition = {
  ...OPEN_LONG,
  direction: 'SHORT',
  size: '1000000000000000000', // 1 WETH (exposure = the debt leg for a short)
  legs: [{ venue: MARKET.venue, subId: '7', account: mockAccountAddress, debt: '1000000000000000000' }],
  equity: '2076000000', // 4,000 USDC collateral − 1·1,924 mark
  costBasisUsd: '2000000000',
}

afterEach(() => {
  mockPositions.current = []
  mockHistory.current = [CLOSED_SHORT]
})

// mycelium's Text compiles `color="$statusCritical"` to a uniwind arbitrary class such as
// `[color:var(--stext-statusCritical)]`; read the CSS var straight off that class.
function getDeclaredColorToken(element: HTMLElement): string | undefined {
  const colorClass = Array.from(element.classList).find((className) => className.startsWith('[color:var('))
  return colorClass?.match(/\[color:(var\(--[^)]+\))\]/)?.[1]
}

describe('MarginPositionsTable', () => {
  it('subtitles an open row with CURRENT leverage, not leverage at open', () => {
    mockPositions.current = [OPEN_LONG]
    render(<MarginPositionsTable />)
    expect(screen.getByText('Long 3.3x')).toBeInTheDocument()
    expect(screen.queryByText(/Long 2x/)).not.toBeInTheDocument()
  })

  // The server omits `leverage` when equity is non-positive: there is no finite leverage to report,
  // and rendering 1x would paint a position about to liquidate as unlevered.
  it('subtitles an open row with no finite leverage as ∞ rather than 1x', () => {
    mockPositions.current = [{ ...OPEN_LONG, leverage: undefined }]
    render(<MarginPositionsTable />)
    expect(screen.getByText('Long ∞')).toBeInTheDocument()
  })

  it('still reports leverage for an open row carrying no cost basis', () => {
    mockPositions.current = [{ ...OPEN_LONG, entryPrice: '0', openedAt: '0', openedLeverage: undefined }]
    render(<MarginPositionsTable />)
    expect(screen.getByText('Long 3.3x')).toBeInTheDocument()
  })

  it('renders a Short subtitle in $statusCritical for a closed short row', () => {
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    const shortText = screen.getByText('Short')
    expect(getDeclaredColorToken(shortText)).toBe('var(--stext-statusCritical)')
  })

  // Scoped to the cell: the expanded-row drawer repeats both figures, and jsdom renders it even while
  // the row is collapsed (HeightAnimator's unmountChildrenWhenCollapsed needs a real animation driver).
  it('reports PnL and RoE in USD against the server basis', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginPnlTrigger)).toHaveTextContent('+$5.66')
    expect(screen.getByTestId(TestID.MarginPnlTrigger)).toHaveTextContent('▲ 22.65%')
  })

  it('reports the margin still in the position at cost, in USD', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginEquityTrigger)).toHaveTextContent('$25.00')
  })

  it('explains that the entry price is not the cost basis', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginEntryPriceTrigger)).toBeInTheDocument()
  })

  it('leaves an absent entry price as a bare dash', () => {
    mockPositions.current = [{ ...OPEN_LONG_VALUED, entryPrice: '0', openedAt: '0' }]
    render(<MarginPositionsTable />)
    expect(screen.queryByTestId(TestID.MarginEntryPriceTrigger)).not.toBeInTheDocument()
  })

  it('breaks the margin column down into cost, value now and the difference', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginEquityTrigger)).toBeInTheDocument()
  })

  it('offers a PnL explainer on the column header', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginPnlHeaderInfo)).toBeInTheDocument()
  })

  it('explains why PnL is a dash on an untradable pair', () => {
    mockPositions.current = [{ ...OPEN_LONG_VALUED, isTradable: false }]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginPnlSuppressed)).toBeInTheDocument()
  })

  it('explains why PnL is a dash before the server has valued the position', () => {
    mockPositions.current = [OPEN_LONG]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginPnlSuppressed)).toBeInTheDocument()
  })

  it('explains why PnL is a dash with no oracle price', () => {
    mockPositions.current = [{ ...OPEN_LONG_VALUED, oraclePrice: '0' }]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginPnlSuppressed)).toBeInTheDocument()
  })

  // Same sentinel, one column over: the mark cell must not render a confident $0.00 beside the dashes
  // PnL and Equity put up for exactly this state.
  it('dashes the mark with no oracle price instead of pricing the asset at zero', () => {
    mockPositions.current = [{ ...OPEN_LONG_VALUED, oraclePrice: '0' }]
    render(<MarginPositionsTable />)
    // FiatTokenPrice renders a zero as '$0', not '$0.00' — match what the cell would actually emit.
    expect(screen.queryByText('$0')).toBeNull()
  })

  // A calendar age derives from `openedAt` alone. Coupling it to the entry price dropped an age the
  // wire fully supports on any position carrying the '0' entry-price sentinel. formatAge emits e.g.
  // '431d' — a bare unit-suffixed count.
  it('still reports the age of a position with no at-open mark', () => {
    mockPositions.current = [{ ...OPEN_LONG_VALUED, entryPrice: '0', openedAt: '1753000000' }]
    render(<MarginPositionsTable />)
    expect(screen.getByText(/^\d+[dhm]$/)).toBeInTheDocument()
  })

  it('keeps the PnL figure rendered alongside its explainer trigger', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginPnlTrigger)).toHaveTextContent('+$5.66')
    expect(screen.getByTestId(TestID.MarginPnlTrigger)).toHaveTextContent('▲ 22.65%')
    expect(screen.queryByTestId(TestID.MarginPnlSuppressed)).not.toBeInTheDocument()
  })

  // costBasis.equityContributed (the pre-valuation token-count fallback) has no wire replacement — the
  // Margin column now renders a dash rather than a fabricated number until the server can value it.
  it('renders no PnL at all until the server can value the position', () => {
    mockPositions.current = [OPEN_LONG]
    render(<MarginPositionsTable />)
    expect(screen.queryByText(/22.65%/)).not.toBeInTheDocument()
    expect(screen.queryByText('0.020 ETH')).not.toBeInTheDocument()
  })

  it('suppresses every USD figure and both prices for an untradable pair', () => {
    mockPositions.current = [{ ...OPEN_LONG_VALUED, isTradable: false }]
    render(<MarginPositionsTable />)
    expect(screen.queryByText('+$5.66')).not.toBeInTheDocument()
    expect(screen.queryByText(/1,924/)).not.toBeInTheDocument()
  })

  it('renders an em dash rather than a $0 entry when no at-open mark was stamped', () => {
    mockPositions.current = [{ ...OPEN_LONG_VALUED, entryPrice: '0' }]
    render(<MarginPositionsTable />)
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
  })

  it('sizes a short by the leg it borrowed, not the stable collateral backing it', () => {
    mockPositions.current = [OPEN_SHORT_VALUED]
    render(<MarginPositionsTable />)
    expect(screen.getByText('1.00 ETH')).toBeInTheDocument()
    expect(screen.queryByText(/4,000 USDC/)).not.toBeInTheDocument()
  })

  // Both rows carry the same (account, subId) leg — the row key is positionId, so a table keyed on
  // the leg's account would collapse them into one.
  it('renders two positions sharing a leg account as two rows', () => {
    mockPositions.current = [OPEN_LONG_VALUED, { ...OPEN_LONG_VALUED, positionId: 'pos-open-long-2' }]
    render(<MarginPositionsTable />)
    expect(screen.getAllByTestId(TestID.MarginEntryPriceTrigger)).toHaveLength(2)
  })

  // Debt is a per-leg figure now: a debt-free position quotes the mark and nothing else — the row
  // suppresses the liquidation price client-side off a zero leg debt, not off any server sentinel.
  it('renders no liquidation price for a position whose leg carries no debt', () => {
    mockPositions.current = [
      { ...OPEN_LONG_VALUED, legs: [{ venue: MARKET.venue, subId: '7', account: mockAccountAddress, debt: '0' }] },
    ]
    render(<MarginPositionsTable />)
    expect(screen.getByText(/1,924/)).toBeInTheDocument()
    expect(screen.queryByText(/1,555/)).not.toBeInTheDocument()
  })

  it('values a short off its stable collateral leg', () => {
    mockPositions.current = [OPEN_SHORT_VALUED]
    render(<MarginPositionsTable />)
    expect(screen.getByText('$2,000.00')).toBeInTheDocument()
    expect(screen.getByText('+$76.00')).toBeInTheDocument()
    expect(screen.getByText('▲ 3.80%')).toBeInTheDocument()
  })

  it('reports history realized PnL in USD, so both tabs of this table agree', () => {
    mockHistory.current = [
      { ...CLOSED_SHORT, direction: 'LONG', realizedPnlUsd: '-1234560000', realizedPnl: '5000000000000000000' },
    ]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getByText('-$1,234.56')).toBeInTheDocument()
    // The collateral-token figure stays on the wire and must not be what renders.
    expect(screen.queryByText(/5 ETH/)).not.toBeInTheDocument()
  })

  // A closed short's size is the WETH it borrowed, so scaling it by the stable collateral's decimals
  // reports 2 WETH as 2e12 and labels it USDC.
  it('sizes a closed short by its exposure leg, in that leg’s own symbol', () => {
    mockHistory.current = [CLOSED_SHORT]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getByText('2.00 ETH')).toBeInTheDocument()
    expect(screen.queryByText(/[\d.]+\s(USDC|USDT)/)).not.toBeInTheDocument()
  })

  it('renders an em dash for a history row the server could not value', () => {
    mockHistory.current = [CLOSED_SHORT]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('explains realized PnL on a closed position', () => {
    mockHistory.current = [
      { ...CLOSED_SHORT, direction: 'LONG', realizedPnlUsd: '-1234560000', realizedPnl: '5000000000000000000' },
    ]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getByTestId(TestID.MarginRealizedTrigger)).toBeInTheDocument()
  })

  it('leaves an unexplainable realized figure as a bare dash', () => {
    mockHistory.current = [{ ...CLOSED_SHORT, direction: 'LONG', realizedPnlUsd: undefined }]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.queryByTestId(TestID.MarginRealizedTrigger)).not.toBeInTheDocument()
  })

  // currencyInfos is mocked to an empty Map above, so an unresolved market's fallback can never
  // resolve a symbol for either leg — both must degrade to a shortened address together.
  it('renders a normalised pair, never a raw wire address, for a history row whose market cannot resolve', () => {
    mockHistory.current = [UNRESOLVED_CLOSED]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(
      screen.getByText(
        `${shortenAddress({ address: UNRESOLVED_COLLATERAL })} / ${shortenAddress({ address: UNRESOLVED_DEBT })}`,
      ),
    ).toBeInTheDocument()
  })

  // An unresolvable market is a real state on both tabs. `size` is denominated in exposureToken,
  // whose decimals are on the wire, so rendering the raw integer is wrong by 18 orders of magnitude.
  it('formats size for an open row whose market cannot resolve, instead of the raw wire integer', () => {
    mockPositions.current = [UNRESOLVED_OPEN]
    render(<MarginPositionsTable />)
    expect(screen.getByText('0.053')).toBeInTheDocument()
    expect(screen.queryByText(UNRESOLVED_OPEN.size)).not.toBeInTheDocument()
  })

  // An untradable pair has no single USD leg, so its entry/exit prices are quoted against something
  // that is not dollars. Rendering them through a fiat formatter puts debt-token units on screen as
  // dollars, right beside the realized-PnL dash that exists because the server could not price it.
  it('dashes the entry→exit prices of an untradable closed position instead of pricing them in USD', () => {
    mockHistory.current = [
      { ...CLOSED_SHORT, isTradable: false, entryPrice: `${1850n * 10n ** 18n}`, exitPrice: `${2000n * 10n ** 18n}` },
    ]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.queryByText(/\$1,850/)).toBeNull()
    expect(screen.queryByText(/\$2,000/)).toBeNull()
  })

  // The Closed tab has no status column, so the pill IS the only signal a close was a liquidation —
  // and neither the pill nor the direction/leverage subtitle needs the market to render.
  it('keeps the liquidation pill on a history row whose market cannot resolve', () => {
    mockHistory.current = [{ ...UNRESOLVED_CLOSED, status: 'LIQUIDATED' }]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getByText('Liquidated')).toBeInTheDocument()
  })

  it('formats size for a history row whose market cannot resolve, instead of the raw wire integer', () => {
    mockHistory.current = [UNRESOLVED_CLOSED]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getByText('0.053')).toBeInTheDocument()
    expect(screen.queryByText(UNRESOLVED_CLOSED.size)).not.toBeInTheDocument()
  })
})
