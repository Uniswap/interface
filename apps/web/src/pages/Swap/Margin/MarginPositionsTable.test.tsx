import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { TestID } from '@universe/test'
import {
  MARGIN_POSITIONS_WIRE_PNL_ACTIVE,
  MARGIN_POSITIONS_WIRE_PNL_TERMINAL,
} from 'uniswap/src/data/apiClients/tradingApi/__fixtures__/marginPositionsWirePnl'
import {
  MARGIN_ACTIVE_POSITION_STATUSES,
  MARGIN_TERMINAL_POSITION_STATUSES,
  MarginPositionStatus,
  type MarginActivePosition,
  type MarginPositionsRequest,
  type MarginPositionsResponse,
  type MarginTerminalPosition,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { toMarginPositionsView } from 'uniswap/src/data/apiClients/tradingApi/marginPositionsView'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { shortenAddress } from 'utilities/src/addresses'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isMarginActivePosition, isMarginTerminalPosition } from '~/features/margin/utils/marginPositionRow'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import type { MarginPositionSheetArgs } from '~/pages/Swap/Margin/components/MarginPositionSheet'
import { MarginPositionsTable } from '~/pages/Swap/Margin/MarginPositionsTable'
import { render } from '~/test-utils/render'

const MARKET = getDefaultMarginMarket() // WETH/USDC MORPHO

const {
  mockAccountAddress,
  mockFetchNextPage,
  mockHasNextPage,
  mockHistory,
  mockPositions,
  mockRequestedParams,
  UNRESOLVED_COLLATERAL,
  UNRESOLVED_DEBT,
} = vi.hoisted(() => ({
  mockAccountAddress: '0x000000000000000000000000000000000000000A',
  mockHasNextPage: { current: false },
  mockFetchNextPage: vi.fn(() => Promise.resolve()),
  mockRequestedParams: [] as (MarginPositionsRequest | undefined)[],
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

vi.mock('~/connection/hooks/useAccount', () => ({
  useAccount: () => ({ address: mockAccountAddress }),
}))

vi.mock('~/features/margin/hooks/useMarginMarkets', () => ({
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
  direction: MarginDirection.SHORT,
} as typeof MARKET

function resolveMarketForTokens(tokens: { collateralToken: string; debtToken: string }): typeof MARKET | undefined {
  if (tokens.collateralToken === UNRESOLVED_COLLATERAL && tokens.debtToken === UNRESOLVED_DEBT) {
    return undefined
  }
  return tokens.collateralToken === MARKET.debt.address ? SHORT_MARKET : MARKET
}

vi.mock('~/features/margin/hooks/useResolveMarginMarket', () => ({
  useResolveMarginMarket: () => resolveMarketForTokens,
  useResolveMarginMarketForPosition: () => MARKET,
}))

vi.mock('~/features/margin/hooks/useMarginCurrencyInfos', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/margin/hooks/useMarginCurrencyInfos')>()),
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
  direction: MarginDirection.SHORT,
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
  direction: MarginDirection.LONG,
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

// Serves each status set its own rows, as the server does, and records what every observer asked for.
vi.mock('uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery')>()),
  useMarginPositionsQuery: ({ params }: { params?: MarginPositionsRequest }) => {
    mockRequestedParams.push(params)
    if (!params) {
      return { data: undefined, isLoading: false, isError: false, refetch: vi.fn() }
    }
    const isActiveSet = params.statuses === MARGIN_ACTIVE_POSITION_STATUSES
    return {
      data: { ...POSITIONS_RESPONSE, positions: isActiveSet ? mockPositions.current : mockHistory.current },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }
  },
  useMarginPositionsInfiniteQuery: ({ params }: { params?: MarginPositionsRequest }) => {
    mockRequestedParams.push(params)
    if (!params) {
      return { data: undefined, isLoading: false, isError: false, refetch: vi.fn(), hasNextPage: false }
    }
    const isActiveSet = params.statuses === MARGIN_ACTIVE_POSITION_STATUSES
    return {
      data: {
        pages: [{ ...POSITIONS_RESPONSE, positions: isActiveSet ? mockPositions.current : mockHistory.current }],
        pageParams: [undefined],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      hasNextPage: mockHasNextPage.current,
      isFetchingNextPage: false,
      fetchNextPage: mockFetchNextPage,
    }
  },
}))

// ltv 0.695 → 1/(1-0.695) = 3.2787x current, against 2x at open — the two must be distinguishable.
const OPEN_LONG: MarginActivePosition = {
  status: 'ACTIVE',
  positionId: 'pos-open-long',
  direction: MarginDirection.LONG,
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
  equity: '15936590436590437', // 0.053 − 71.31/1924 WETH
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
// equity is 4000 − 1924 = $2,076, so PnL is +$76 (+3.80%). Its exposure is the WETH it borrowed; its
// equity and PnL are in the collateral leg, USDC.
const OPEN_SHORT_VALUED: MarginActivePosition = {
  ...OPEN_LONG,
  direction: MarginDirection.SHORT,
  size: '1000000000000000000', // 1 WETH (exposure = the debt leg for a short)
  legs: [{ venue: MARKET.venue, subId: '7', account: mockAccountAddress, debt: '1000000000000000000' }],
  equity: '2076000000', // 4,000 USDC collateral − 1·1,924 mark
  unrealizedPnl: '76000000',
  roe: '38000000000000000',
  depositedEquity: '2000000000',
  costBasisUsd: '2000000000',
}

// The served rows as the table receives them: one wallet's four longs (Morpho first) and another wallet's three
// closed longs.
const WIRE_ACTIVE = toMarginPositionsView(MARGIN_POSITIONS_WIRE_PNL_ACTIVE).positions.filter(isMarginActivePosition)
const WIRE_TERMINAL = toMarginPositionsView(MARGIN_POSITIONS_WIRE_PNL_TERMINAL).positions.filter(
  isMarginTerminalPosition,
)

function wireMorphoRow(): MarginActivePosition {
  return WIRE_ACTIVE[0]
}

// The design's figures at full size: 7.5 WETH held, 3.13 WETH of it margin, 0.107 WETH down on the margin
// deposited (−3.39%), at a 2,496.49 mark.
const DESIGN_LONG: MarginActivePosition = {
  ...OPEN_LONG,
  size: '7500000000000000000',
  equity: '3130000000000000000',
  unrealizedPnl: '-107000000000000000',
  roe: '-33900000000000000',
  oraclePrice: '2496490000000000000000',
}

function scrollCardsEndIntoView(): void {
  const observer = vi.mocked(IntersectionObserver).mock.calls.at(-1)?.[0]
  act(() => observer?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver))
}

afterEach(() => {
  mockPositions.current = []
  mockHistory.current = [CLOSED_SHORT]
  mockRequestedParams.length = 0
  mockHasNextPage.current = false
  mockFetchNextPage.mockClear()
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
    mockPositions.current = [{ ...OPEN_LONG, leverage: undefined, equity: '0' }]
    render(<MarginPositionsTable />)
    expect(screen.getByText('Long ∞')).toBeInTheDocument()
  })

  it('subtitles served rows with the leverage they hold now', () => {
    mockPositions.current = WIRE_ACTIVE
    render(<MarginPositionsTable />)
    expect(screen.getAllByText(/^Long /).map((node) => node.textContent)).toEqual([
      'Long 2.1x',
      'Long 1.1x',
      'Long 2.1x',
      'Long 2x',
    ])
  })

  // A wire without `leverage` but with positive equity still holds a finite position: size / equity.
  it('derives the current leverage from size and equity when the wire omits it', () => {
    mockPositions.current = [{ ...wireMorphoRow(), leverage: undefined }]
    render(<MarginPositionsTable />)
    expect(screen.getByText('Long 2.1x')).toBeInTheDocument()
  })

  it('drops the leverage figure, not the side, when neither leverage nor equity parses', () => {
    mockPositions.current = [{ ...wireMorphoRow(), leverage: undefined, equity: '' }]
    render(<MarginPositionsTable />)
    expect(screen.getByText('Long')).toBeInTheDocument()
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

  // PnL in the collateral token over the RoE, both as the wire serves them (equity − depositedEquity,
  // and that over depositedEquity). A long's collateral is its exposure, WETH.
  it('reports PnL in the collateral token over its RoE on a served row', () => {
    mockPositions.current = [wireMorphoRow()]
    render(<MarginPositionsTable />)
    const pnl = screen.getByTestId(TestID.MarginPnlTrigger)
    // −0.0000568 WETH sits under TokenNonTx's 0.001 floor.
    expect(pnl).toHaveTextContent('>-0.001 ETH')
    expect(pnl).toHaveTextContent('▼ 5.68%')
    expect(getDeclaredColorToken(screen.getByText('>-0.001 ETH'))).toBe('var(--stext-statusCritical)')
  })

  it('reports the design’s figures at full size', () => {
    mockPositions.current = [DESIGN_LONG]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginPnlTrigger)).toHaveTextContent('-0.107 ETH▼ 3.39%')
    expect(screen.getByText('7.50 ETH')).toBeInTheDocument()
    expect(screen.getByText('$18,723.68')).toBeInTheDocument()
    expect(screen.getByText('3.13 ETH')).toBeInTheDocument()
    expect(screen.getByText('$7,814.01')).toBeInTheDocument()
  })

  it('colours a gain success and points its arrow up', () => {
    mockPositions.current = [{ ...DESIGN_LONG, unrealizedPnl: '107000000000000000', roe: '33900000000000000' }]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginPnlTrigger)).toHaveTextContent('+0.107 ETH▲ 3.39%')
    expect(getDeclaredColorToken(screen.getByText('+0.107 ETH'))).toBe('var(--stext-statusSuccess)')
  })

  it('values size and margin at the row’s own mark on a served row', () => {
    mockPositions.current = [wireMorphoRow()]
    render(<MarginPositionsTable />)
    // 0.002 WETH and 0.000943 WETH at 2,386.20.
    expect(screen.getByText('0.002 ETH')).toBeInTheDocument()
    expect(screen.getByText('$4.77')).toBeInTheDocument()
    expect(screen.getByText('<0.001 ETH')).toBeInTheDocument()
    expect(screen.getByText('$2.25')).toBeInTheDocument()
  })

  it('dashes PnL where the wire carries no unrealized figure', () => {
    for (const unrealizedPnl of [undefined, '', 'abc']) {
      mockPositions.current = [{ ...wireMorphoRow(), unrealizedPnl }]
      const { unmount } = render(<MarginPositionsTable />)
      expect(screen.getByTestId(TestID.MarginPnlSuppressed)).toHaveTextContent('—')
      expect(screen.queryByText(/5\.68%/)).not.toBeInTheDocument()
      unmount()
    }
  })

  it('keeps the PnL figure but drops the RoE line where the wire carries no roe', () => {
    mockPositions.current = [{ ...DESIGN_LONG, roe: undefined }]
    render(<MarginPositionsTable />)
    expect(screen.getByTestId(TestID.MarginPnlTrigger)).toHaveTextContent('-0.107 ETH')
    expect(screen.queryByText(/3\.39%/)).not.toBeInTheDocument()
  })

  it('dashes the margin where the wire’s equity does not parse', () => {
    mockPositions.current = [{ ...DESIGN_LONG, equity: '' }]
    render(<MarginPositionsTable />)
    expect(screen.queryByText('3.13 ETH')).not.toBeInTheDocument()
    expect(screen.queryByText('$7,814.01')).not.toBeInTheDocument()
  })

  // No honest dollar value without a USD leg or a mark: the token figures stay, the dollar lines go.
  it('drops the dollar lines, not the token figures, for an untradable pair or an absent mark', () => {
    for (const overrides of [{ isTradable: false }, { oraclePrice: '0' }]) {
      mockPositions.current = [{ ...DESIGN_LONG, ...overrides }]
      const { unmount } = render(<MarginPositionsTable />)
      expect(screen.getByText('7.50 ETH')).toBeInTheDocument()
      expect(screen.getByText('3.13 ETH')).toBeInTheDocument()
      expect(screen.queryByText('$18,723.68')).not.toBeInTheDocument()
      expect(screen.queryByText('$7,814.01')).not.toBeInTheDocument()
      unmount()
    }
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

  it('reads a short’s margin and PnL in its stable collateral, not the borrowed leg', () => {
    mockPositions.current = [OPEN_SHORT_VALUED]
    render(<MarginPositionsTable />)
    expect(screen.getByText(/^2,076(\.00)? USDC$/)).toBeInTheDocument()
    expect(screen.getByText('$2,076.00')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.MarginPnlTrigger)).toHaveTextContent(/\+76(\.00)? USDC▲ 3\.80%/)
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

  it('orders the active columns Position · Mark/Entry · PnL · Liq. price · Size · Margin · Opened', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable />)
    const headers = ['Position', 'Mark / Entry price', 'PnL', 'Liq. price', 'Size', 'Margin', 'Opened'].map(
      (label) => screen.getAllByText(label)[0],
    )
    headers.slice(1).forEach((header, i) => {
      expect(headers[i].compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  it('stacks the mark over the entry price in one cell', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable />)
    const entry = screen.getByTestId(TestID.MarginEntryPriceTrigger)
    expect(entry).toHaveTextContent('1,850')
    const mark = screen.getByText(/^\$1,924/)
    expect(mark.compareDocumentPosition(entry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  // HF 1.237 sits in the caution tier; the liq price is 19.1% below a 1,924 mark.
  it('quotes a long liquidation price with its signed distance below the mark, in the tier color', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable />)
    expect(getDeclaredColorToken(screen.getByText(/^\$1,555/))).toBe('var(--stext-statusWarning)')
    expect(getDeclaredColorToken(screen.getByText('(−19.1%)'))).toBe('var(--stext-statusWarning)')
  })

  it('quotes a short liquidation price above the mark, in neutral when healthy', () => {
    mockPositions.current = [
      { ...OPEN_SHORT_VALUED, liquidationPrice: `${2200n * 10n ** 18n}`, healthFactor: `${15n * 10n ** 17n}` },
    ]
    render(<MarginPositionsTable />)
    expect(getDeclaredColorToken(screen.getByText(/^\$2,200/))).toBe('var(--stext-neutral1)')
    expect(getDeclaredColorToken(screen.getByText('(+14.3%)'))).toBe('var(--stext-neutral2)')
  })

  it('reports history realized PnL in USD, so both tabs of this table agree', () => {
    mockHistory.current = [
      {
        ...CLOSED_SHORT,
        direction: MarginDirection.LONG,
        realizedPnlUsd: '-1234560000',
        realizedPnl: '5000000000000000000',
      },
    ]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getByText('-$1,234.56')).toBeInTheDocument()
    // The collateral-token figure stays on the wire and must not be what renders.
    expect(screen.queryByText(/5 ETH/)).not.toBeInTheDocument()
  })

  // The served closed rows: `size` is what was still held at the final close, entry/exit are 18-dec USD,
  // realizedPnlInDebt (6-dec USDC on a long) is the realized PnL, and closedAt arrives in milliseconds.
  it('renders served closed rows as Pair · Closed size · Entry → Exit · Realized PnL · Closed', () => {
    mockHistory.current = WIRE_TERMINAL
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    const headers = ['Pair', 'Closed size', 'Entry → Exit', 'Realized PnL'].map((label) => screen.getByText(label))
    headers.slice(1).forEach((header, i) => {
      expect(headers[i].compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
    expect(screen.getAllByText('Long')).toHaveLength(3)
    expect(screen.getByText('$2,406.12 → $2,417.41')).toBeInTheDocument()
    expect(screen.getByText('$2,444.05 → $2,424.16')).toBeInTheDocument()
    expect(screen.getByText('+$0.02')).toBeInTheDocument()
    expect(getDeclaredColorToken(screen.getByText('-$0.05'))).toBe('var(--stext-statusCritical)')
    expect(screen.getByText('0.001 ETH')).toBeInTheDocument()
    expect(screen.getByText('0.004 ETH')).toBeInTheDocument()
    expect(screen.getAllByText('10/16/2026')).toHaveLength(2)
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
      {
        ...CLOSED_SHORT,
        direction: MarginDirection.LONG,
        realizedPnlUsd: '-1234560000',
        realizedPnl: '5000000000000000000',
      },
    ]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getByTestId(TestID.MarginRealizedTrigger)).toBeInTheDocument()
  })

  it('leaves an unexplainable realized figure as a bare dash', () => {
    mockHistory.current = [{ ...CLOSED_SHORT, direction: MarginDirection.LONG, realizedPnlUsd: undefined }]
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

  it('pills a close after a partial liquidation as partially liquidated', () => {
    mockHistory.current = [{ ...CLOSED_SHORT, status: 'PARTIALLY_LIQUIDATED' }]
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getByText('Partially liquidated')).toBeInTheDocument()
  })
})

describe('MarginPositionsTable status requests', () => {
  const requestedStatuses = (): (MarginPositionsRequest['statuses'] | undefined)[] =>
    mockRequestedParams.map((params) => params?.statuses)

  it('requests ACTIVE alone for the Active tab and leaves the Closed set unrequested', () => {
    render(<MarginPositionsTable />)
    expect(mockRequestedParams).toContainEqual({
      swapper: mockAccountAddress,
      chainId: 1,
      statuses: MARGIN_ACTIVE_POSITION_STATUSES,
    })
    expect(requestedStatuses()).not.toContain(MARGIN_TERMINAL_POSITION_STATUSES)
  })

  it('requests the three finished statuses once the Closed tab opens', () => {
    render(<MarginPositionsTable />)
    fireEvent.click(screen.getByText('Closed'))
    expect(mockRequestedParams).toContainEqual({
      swapper: mockAccountAddress,
      chainId: 1,
      statuses: [
        MarginPositionStatus.COMPLETED,
        MarginPositionStatus.LIQUIDATED,
        MarginPositionStatus.PARTIALLY_LIQUIDATED,
      ],
    })
  })

  it('renders each tab from its own status set', () => {
    mockPositions.current = [OPEN_LONG]
    render(<MarginPositionsTable />)
    expect(screen.getByText('Long 3.3x')).toBeInTheDocument()
    expect(screen.queryByText('Short')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Closed'))
    expect(screen.getByText('Short')).toBeInTheDocument()
    expect(screen.queryByText('Long 3.3x')).not.toBeInTheDocument()
  })
})

// Stands in for MarginPositionSheet (its own suite covers the layout): shows what the table hands it.
function renderSheetStub(args: MarginPositionSheetArgs): JSX.Element {
  return (
    <div data-testid="position-sheet-stub" data-open={String(args.isOpen)} data-position={args.position.positionId}>
      <div data-testid="position-sheet-stub-pnl">{args.figures.pnl}</div>
      <div data-testid="position-sheet-stub-liq">{args.figures.liqPrice}</div>
      <div data-testid="position-sheet-stub-margin">{args.figures.margin}</div>
      <div onClick={args.onClose}>stub-close</div>
    </div>
  )
}

describe('MarginPositionsTable cards layout', () => {
  it('opens the tapped position in the sheet, with the table’s own figures, and closes it', () => {
    mockPositions.current = [OPEN_LONG_VALUED, { ...OPEN_SHORT_VALUED, positionId: 'pos-open-short' }]
    render(<MarginPositionsTable layout="cards" renderPositionSheet={renderSheetStub} />)
    expect(screen.queryByTestId('position-sheet-stub')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Long 3.3x'))
    const sheet = screen.getByTestId('position-sheet-stub')
    expect(sheet).toHaveAttribute('data-open', 'true')
    expect(sheet).toHaveAttribute('data-position', OPEN_LONG_VALUED.positionId)
    expect(screen.getByTestId('position-sheet-stub-pnl')).toHaveTextContent('—')
    expect(screen.getByTestId('position-sheet-stub-liq')).toHaveTextContent('$1,555.93')
    expect(screen.getByTestId('position-sheet-stub-margin')).toHaveTextContent('0.016 ETH')

    fireEvent.click(screen.getByText('stub-close'))
    expect(screen.getByTestId('position-sheet-stub')).toHaveAttribute('data-open', 'false')
  })

  it('renders one card per active position, carrying the table’s figures under their labels', () => {
    mockPositions.current = [OPEN_LONG_VALUED, { ...OPEN_SHORT_VALUED, positionId: 'pos-open-short' }]
    render(<MarginPositionsTable layout="cards" renderPositionSheet={renderSheetStub} />)
    expect(screen.getAllByTestId(TestID.MarginPositionCard)).toHaveLength(2)
    const [longCard] = screen.getAllByTestId(TestID.MarginPositionCard)
    expect(longCard).toHaveTextContent('Long 3.3x')
    expect(longCard).toHaveTextContent('PnL')
    expect(longCard).not.toHaveTextContent('PnL/RoE')
    expect(longCard).toHaveTextContent('Mark / Entry price')
    expect(longCard).toHaveTextContent('Liq. price')
    expect(longCard).toHaveTextContent('0.053 ETH')
  })

  it('loads the next page of active positions when the end of the cards scrolls into view', async () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    mockHasNextPage.current = true
    render(<MarginPositionsTable layout="cards" renderPositionSheet={renderSheetStub} />)
    scrollCardsEndIntoView()
    await waitFor(() => expect(mockFetchNextPage).toHaveBeenCalledTimes(1))
  })

  // TODO: unskip once useInfiniteScroll attaches to a sentinel that mounts after the first render
  // (the Closed tab's). Until then no observer exists here; this only passed by firing the previous
  // test's leaked observer.
  // oxlint-disable-next-line jest/no-disabled-tests, vitest/no-disabled-tests -- see TODO above
  it.skip('loads the next page of closed positions when the end of the cards scrolls into view', async () => {
    mockHasNextPage.current = true
    render(<MarginPositionsTable layout="cards" renderPositionSheet={renderSheetStub} />)
    fireEvent.click(screen.getByText('Closed'))
    scrollCardsEndIntoView()
    await waitFor(() => expect(mockFetchNextPage).toHaveBeenCalledTimes(1))
  })

  it('does not load past the last page', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable layout="cards" renderPositionSheet={renderSheetStub} />)
    scrollCardsEndIntoView()
    expect(mockFetchNextPage).not.toHaveBeenCalled()
  })

  it('renders no table columns, which cannot fit a phone', () => {
    mockPositions.current = [OPEN_LONG_VALUED]
    render(<MarginPositionsTable layout="cards" renderPositionSheet={renderSheetStub} />)
    expect(screen.queryByText('Position')).not.toBeInTheDocument()
    expect(screen.queryByText('Opened')).not.toBeInTheDocument()
  })

  it('renders closed positions as cards with realized PnL, entry → exit and closed size', () => {
    mockHistory.current = [{ ...CLOSED_SHORT, realizedPnlUsd: '-12500000' }]
    render(<MarginPositionsTable layout="cards" renderPositionSheet={renderSheetStub} />)
    fireEvent.click(screen.getByText('Closed'))
    const card = screen.getByTestId(TestID.MarginPositionCard)
    expect(card).toHaveTextContent('Realized PnL')
    expect(card).toHaveTextContent('Entry → Exit')
    expect(card).toHaveTextContent('Closed size')
    expect(card).toHaveTextContent('2.00 ETH')
  })

  it('shows the empty message without a column-header echo', () => {
    render(<MarginPositionsTable layout="cards" renderPositionSheet={renderSheetStub} />)
    expect(screen.getByText('No active positions')).toBeInTheDocument()
    expect(screen.queryByText('Mark / Entry price')).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.MarginPositionCard)).not.toBeInTheDocument()
  })
})
